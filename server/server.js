import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const clients = new Map();
const groups = new Map();
let groupIdCounter = 1;
const privateRooms = new Map();

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("register", (clientName, callback) => {
    const nameExists = Array.from(clients.values()).some(
      (client) => client.name.toLowerCase() === clientName.toLowerCase()
    );

    if (nameExists) {
      callback({
        success: false,
        error: "Name already taken. Please choose another name.",
      });
      return;
    }

    if (!clientName || clientName.trim().length === 0) {
      callback({ success: false, error: "Name cannot be empty." });
      return;
    }

    clients.set(socket.id, {
      name: clientName.trim(),
      socketId: socket.id,
    });

    console.log(`Client registered: ${clientName} (${socket.id})`);

    callback({ success: true });

    const clientList = Array.from(clients.values()).map((client) => ({
      name: client.name,
      socketId: client.socketId,
    }));
    socket.emit("clientList", clientList);

    socket.broadcast.emit("clientJoined", {
      name: clientName.trim(),
      socketId: socket.id,
    });

    const groupList = Array.from(groups.entries()).map(([groupId, group]) => ({
      groupId,
      name: group.name,
      creator: group.creator,
      members: Array.from(group.members).map((memberId) => ({
        name: clients.get(memberId)?.name || "Unknown",
        socketId: memberId,
      })),
    }));
    socket.emit("groupList", groupList);
  });

  socket.on("privateMessage", ({ recipientId, message }) => {
    console.log(
      `Private message from ${socket.id} to ${recipientId}: ${message}`
    );

    const sender = clients.get(socket.id);
    if (!sender) {
      socket.emit("error", { message: "You must register first." });
      return;
    }

    const recipient = clients.get(recipientId);
    if (!recipient) {
      socket.emit("error", { message: "Recipient not found." });
      return;
    }

    const roomId = [socket.id, recipientId].sort().join("-");

    if (!privateRooms.has(roomId)) {
      privateRooms.set(roomId, {
        participants: new Set([socket.id, recipientId]),
      });
    }

    socket.join(roomId);
    io.to(recipientId).socketsJoin(roomId);

    const messageData = {
      roomId,
      sender: {
        name: sender.name,
        socketId: socket.id,
      },
      recipient: {
        name: recipient.name,
        socketId: recipientId,
      },
      message,
      timestamp: new Date().toISOString(),
    };

    console.log(`Sending private message to room ${roomId}`);
    console.log(
      `Room participants: ${Array.from(
        privateRooms.get(roomId)?.participants || []
      )}`
    );
    console.log(
      `Sender socket: ${socket.id}, Recipient socket: ${recipientId}`
    );

    io.to(roomId).emit("privateMessage", messageData);
    socket.emit("privateMessage", messageData);
    io.to(recipientId).emit("privateMessage", messageData);

    console.log(
      `Message sent to sender ${socket.id} and recipient ${recipientId}`
    );
  });

  socket.on("createGroup", ({ groupName }, callback) => {
    const creator = clients.get(socket.id);
    if (!creator) {
      callback({ success: false, error: "You must register first." });
      return;
    }

    if (!groupName || groupName.trim().length === 0) {
      callback({ success: false, error: "Group name cannot be empty." });
      return;
    }

    const groupId = `group-${groupIdCounter++}`;
    const group = {
      name: groupName.trim(),
      creator: {
        name: creator.name,
        socketId: socket.id,
      },
      members: new Set([socket.id]),
    };

    groups.set(groupId, group);
    socket.join(groupId);

    console.log(`Group created: ${groupName} (${groupId}) by ${creator.name}`);

    callback({
      success: true,
      groupId,
      group: {
        groupId,
        name: group.name,
        creator: group.creator,
        members: Array.from(group.members).map((memberId) => ({
          name: clients.get(memberId)?.name || "Unknown",
          socketId: memberId,
        })),
      },
    });

    const groupData = {
      groupId,
      name: group.name,
      creator: group.creator,
      members: Array.from(group.members).map((memberId) => ({
        name: clients.get(memberId)?.name || "Unknown",
        socketId: memberId,
      })),
    };
    io.emit("groupCreated", groupData);
  });

  socket.on("joinGroup", ({ groupId }, callback) => {
    const client = clients.get(socket.id);
    if (!client) {
      callback({ success: false, error: "You must register first." });
      return;
    }

    const group = groups.get(groupId);
    if (!group) {
      callback({ success: false, error: "Group not found." });
      return;
    }

    if (group.members.has(socket.id)) {
      callback({
        success: false,
        error: "You are already a member of this group.",
      });
      return;
    }

    group.members.add(socket.id);
    socket.join(groupId);

    console.log(`${client.name} joined group: ${group.name} (${groupId})`);

    callback({
      success: true,
      group: {
        groupId,
        name: group.name,
        creator: group.creator,
        members: Array.from(group.members).map((memberId) => ({
          name: clients.get(memberId)?.name || "Unknown",
          socketId: memberId,
        })),
      },
    });

    const updatedGroup = {
      groupId,
      name: group.name,
      creator: group.creator,
      members: Array.from(group.members).map((memberId) => ({
        name: clients.get(memberId)?.name || "Unknown",
        socketId: memberId,
      })),
    };
    io.to(groupId).emit("groupUpdated", updatedGroup);
    socket.broadcast.emit("groupUpdated", updatedGroup);
  });

  socket.on("groupMessage", ({ groupId, message }) => {
    const sender = clients.get(socket.id);
    if (!sender) {
      socket.emit("error", { message: "You must register first." });
      return;
    }

    const group = groups.get(groupId);
    if (!group) {
      socket.emit("error", { message: "Group not found." });
      return;
    }

    if (!group.members.has(socket.id)) {
      socket.emit("error", { message: "You are not a member of this group." });
      return;
    }

    const messageData = {
      groupId,
      sender: {
        name: sender.name,
        socketId: socket.id,
      },
      message,
      timestamp: new Date().toISOString(),
    };

    io.to(groupId).emit("groupMessage", messageData);
  });

  socket.on("disconnect", () => {
    const client = clients.get(socket.id);

    if (client) {
      console.log(`Client disconnected: ${client.name} (${socket.id})`);

      clients.delete(socket.id);

      groups.forEach((group, groupId) => {
        if (group.members.has(socket.id)) {
          group.members.delete(socket.id);

          if (group.members.size === 0) {
            groups.delete(groupId);
            io.emit("groupDeleted", { groupId });
          } else {
            const updatedGroup = {
              groupId,
              name: group.name,
              creator: group.creator,
              members: Array.from(group.members).map((memberId) => ({
                name: clients.get(memberId)?.name || "Unknown",
                socketId: memberId,
              })),
            };
            io.to(groupId).emit("groupUpdated", updatedGroup);
            socket.broadcast.emit("groupUpdated", updatedGroup);
          }
        }
      });

      socket.broadcast.emit("clientLeft", {
        name: client.name,
        socketId: socket.id,
      });
    } else {
      console.log(`Client disconnected: ${socket.id}`);
    }
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";

httpServer.listen(PORT, HOST, () => {
  console.log(
    `\n🚀 Chat Server running on http://${
      HOST === "0.0.0.0" ? "localhost" : HOST
    }:${PORT}`
  );
  console.log(`📡 Server is accessible from other devices on your network`);
  console.log(`   Use your computer's IP address: http://<YOUR_IP>:${PORT}\n`);
});
