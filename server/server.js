import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

// Health check endpoint for Railway - must respond quickly
app.get("/", (req, res) => {
  console.log("Health check hit at /");
  res.status(200).json({ status: "ok", message: "Chat server is running" });
});

// Health check endpoint (alternative path)
app.get("/health", (req, res) => {
  console.log("Health check hit at /health");
  res.status(200).json({ status: "ok", message: "Chat server is running" });
});

const httpServer = createServer(app);

// Get allowed origins from environment variable or allow all in development
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : "*";

// Warn in production if ALLOWED_ORIGINS is not set
if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
  console.warn('⚠️  WARNING: ALLOWED_ORIGINS is not set in production. CORS is allowing all origins. This is a security risk!');
}

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const clients = new Map();
const groups = new Map();
let groupIdCounter = 1;
const privateRooms = new Map();
const messages = new Map();
let messageIdCounter = 1;

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("register", ({ name: clientName, age }, callback) => {
    if (!clientName || clientName.trim().length === 0) {
      callback({ success: false, error: "Name cannot be empty." });
      return;
    }

    if (!age || age < 1 || age > 150) {
      callback({ success: false, error: "Age must be between 1 and 150." });
      return;
    }

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

    clients.set(socket.id, {
      name: clientName.trim(),
      socketId: socket.id,
      age: age,
    });

    console.log(`Client registered: ${clientName} (age: ${age}, ${socket.id})`);

    callback({ success: true });

    const clientList = Array.from(clients.values()).map((client) => ({
      name: client.name,
      socketId: client.socketId,
      age: client.age,
    }));
    socket.emit("clientList", clientList);

    socket.broadcast.emit("clientJoined", {
      name: clientName.trim(),
      socketId: socket.id,
      age: age,
    });

    const groupList = Array.from(groups.entries()).map(([groupId, group]) => ({
      groupId,
      name: group.name,
      creator: group.creator,
      minimumAge: group.minimumAge,
      members: Array.from(group.members).map((memberId) => {
        const member = clients.get(memberId);
        return {
          name: member?.name || "Unknown",
          socketId: memberId,
          age: member?.age,
        };
      }),
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

    const messageId = `msg-${messageIdCounter++}`;
    const messageData = {
      roomId,
      messageId,
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
      reactions: {},
    };

    messages.set(messageId, {
      roomId,
      type: 'private',
      reactions: {},
    });

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

  socket.on("createGroup", ({ groupName, minimumAge }, callback) => {
    const creator = clients.get(socket.id);
    if (!creator) {
      callback({ success: false, error: "You must register first." });
      return;
    }

    if (!groupName || groupName.trim().length === 0) {
      callback({ success: false, error: "Group name cannot be empty." });
      return;
    }

    if (minimumAge !== undefined && minimumAge !== null) {
      if (minimumAge < 1 || minimumAge > 150) {
        callback({
          success: false,
          error: "Minimum age must be between 1 and 150.",
        });
        return;
      }

      if (minimumAge > creator.age) {
        callback({
          success: false,
          error: `You cannot set minimum age (${minimumAge}) higher than your own age (${creator.age}).`,
        });
        return;
      }
    }

    const groupId = `group-${groupIdCounter++}`;
    const group = {
      name: groupName.trim(),
      creator: {
        name: creator.name,
        socketId: socket.id,
        age: creator.age,
      },
      members: new Set([socket.id]),
      minimumAge: minimumAge,
    };

    groups.set(groupId, group);
    socket.join(groupId);

    console.log(
      `Group created: ${groupName} (${groupId}) by ${creator.name}${
        minimumAge ? ` (min age: ${minimumAge})` : ""
      }`
    );

    const groupResponse = {
      groupId,
      name: group.name,
      creator: group.creator,
      minimumAge: group.minimumAge,
      members: Array.from(group.members).map((memberId) => {
        const member = clients.get(memberId);
        return {
          name: member?.name || "Unknown",
          socketId: memberId,
          age: member?.age,
        };
      }),
    };

    callback({
      success: true,
      groupId,
      group: groupResponse,
    });

    io.emit("groupCreated", groupResponse);
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

    if (group.minimumAge !== undefined && group.minimumAge !== null) {
      if (client.age < group.minimumAge) {
        callback({
          success: false,
          error: `You must be at least ${group.minimumAge} years old to join this group. Your age is ${client.age}.`,
        });
        return;
      }
    }

    group.members.add(socket.id);
    socket.join(groupId);

    console.log(`${client.name} joined group: ${group.name} (${groupId})`);

    const groupResponse = {
      groupId,
      name: group.name,
      creator: group.creator,
      minimumAge: group.minimumAge,
      members: Array.from(group.members).map((memberId) => {
        const member = clients.get(memberId);
        return {
          name: member?.name || "Unknown",
          socketId: memberId,
          age: member?.age,
        };
      }),
    };

    callback({
      success: true,
      group: groupResponse,
    });

    io.to(groupId).emit("groupUpdated", groupResponse);
    socket.broadcast.emit("groupUpdated", groupResponse);
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

    const messageId = `msg-${messageIdCounter++}`;
    const messageData = {
      groupId,
      messageId,
      sender: {
        name: sender.name,
        socketId: socket.id,
      },
      message,
      timestamp: new Date().toISOString(),
      reactions: {},
    };

    messages.set(messageId, {
      groupId,
      type: 'group',
      reactions: {},
    });

    io.to(groupId).emit("groupMessage", messageData);
  });

  socket.on("addReaction", ({ messageId, emoji, roomId, groupId }) => {
    const sender = clients.get(socket.id);
    if (!sender) {
      socket.emit("error", { message: "You must register first." });
      return;
    }

    const message = messages.get(messageId);
    if (!message) {
      socket.emit("error", { message: "Message not found." });
      return;
    }

    if (message.type === 'private') {
      if (message.roomId !== roomId) {
        socket.emit("error", { message: "Invalid room." });
        return;
      }
    } else if (message.type === 'group') {
      const group = groups.get(message.groupId);
      if (!group || !group.members.has(socket.id)) {
        socket.emit("error", { message: "You are not a member of this group." });
        return;
      }
    }

    if (!message.reactions[emoji]) {
      message.reactions[emoji] = [];
    }

    if (!message.reactions[emoji].includes(socket.id)) {
      message.reactions[emoji].push(socket.id);
    }

    const targetRoom = message.type === 'private' ? message.roomId : message.groupId;
    io.to(targetRoom).emit("reactionUpdate", {
      messageId,
      reactions: message.reactions,
    });
  });

  socket.on("removeReaction", ({ messageId, emoji, roomId, groupId }) => {
    const sender = clients.get(socket.id);
    if (!sender) {
      socket.emit("error", { message: "You must register first." });
      return;
    }

    const message = messages.get(messageId);
    if (!message) {
      socket.emit("error", { message: "Message not found." });
      return;
    }

    if (message.type === 'private') {
      if (message.roomId !== roomId) {
        socket.emit("error", { message: "Invalid room." });
        return;
      }
    } else if (message.type === 'group') {
      const group = groups.get(message.groupId);
      if (!group || !group.members.has(socket.id)) {
        socket.emit("error", { message: "You are not a member of this group." });
        return;
      }
    }

    if (message.reactions[emoji]) {
      message.reactions[emoji] = message.reactions[emoji].filter(
        (id) => id !== socket.id
      );
      if (message.reactions[emoji].length === 0) {
        delete message.reactions[emoji];
      }
    }

    const targetRoom = message.type === 'private' ? message.roomId : message.groupId;
    io.to(targetRoom).emit("reactionUpdate", {
      messageId,
      reactions: message.reactions,
    });
  });

  // Typing indicator handlers for private messages
  socket.on("privateTypingStart", ({ recipientId }) => {
    const sender = clients.get(socket.id);
    if (!sender) return;

    const recipient = clients.get(recipientId);
    if (!recipient) return;

    io.to(recipientId).emit("privateTypingStart", {
      sender: {
        name: sender.name,
        socketId: socket.id,
      },
    });
  });

  socket.on("privateTypingStop", ({ recipientId }) => {
    const sender = clients.get(socket.id);
    if (!sender) return;

    const recipient = clients.get(recipientId);
    if (!recipient) return;

    io.to(recipientId).emit("privateTypingStop", {
      sender: {
        name: sender.name,
        socketId: socket.id,
      },
    });
  });

  // Typing indicator handlers for group messages
  socket.on("groupTypingStart", ({ groupId }) => {
    const sender = clients.get(socket.id);
    if (!sender) return;

    const group = groups.get(groupId);
    if (!group || !group.members.has(socket.id)) return;

    socket.to(groupId).emit("groupTypingStart", {
      groupId,
      sender: {
        name: sender.name,
        socketId: socket.id,
      },
    });
  });

  socket.on("groupTypingStop", ({ groupId }) => {
    const sender = clients.get(socket.id);
    if (!sender) return;

    const group = groups.get(groupId);
    if (!group || !group.members.has(socket.id)) return;

    socket.to(groupId).emit("groupTypingStop", {
      groupId,
      sender: {
        name: sender.name,
        socketId: socket.id,
      },
    });
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

// Error handling
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

httpServer.on("error", (error) => {
  console.error("HTTP Server Error:", error);
});

httpServer.listen(PORT, HOST, () => {
  console.log(
    `\n🚀 Chat Server running on http://${
      HOST === "0.0.0.0" ? "localhost" : HOST
    }:${PORT}`
  );
  console.log(`📡 Server is accessible from other devices on your network`);
  console.log(`   Use your computer's IP address: http://<YOUR_IP>:${PORT}\n`);
});
