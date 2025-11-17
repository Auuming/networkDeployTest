# Project Presentation Guide

## Real-Time Chat Application with Socket.IO

---

## 📋 **How the Project Works - Overview**

### **Architecture**

- **Backend**: Node.js/Express server with Socket.IO for real-time communication
- **Frontend**: React/TypeScript client application
- **Communication**: WebSocket-based Socket.IO protocol (bidirectional, real-time)
- **Data Storage**: In-memory Maps and Sets on server (clients, groups, messages, rooms)

### **Key Components**

1. **Server** (`server/server.js`): Manages connections, message routing, group management
2. **Client App** (`client/src/App.tsx`): Main entry point, handles login and socket connection
3. **Chat Interface** (`client/src/components/ChatInterface.tsx`): Main UI, manages state
4. **Client List** (`client/src/components/ClientList.tsx`): Displays online users
5. **Group Manager** (`client/src/components/GroupManager.tsx`): Handles group creation/joining
6. **Chat Room** (`client/src/components/ChatRoom.tsx`): Displays messages and handles sending

### **Data Flow**

1. Client connects to server via Socket.IO
2. Client registers with unique name and age
3. Server maintains client list and broadcasts updates
4. Messages sent via Socket.IO events (`privateMessage`, `groupMessage`)
5. Server routes messages to appropriate rooms/groups
6. Only authorized participants receive messages

---

## ✅ **Requirements Implementation**

---

### **R1 (1.0): System Architecture with Multiple Clients**

**Requirement**: Present system architecture with at least **two clients** running on **different physical computers**. Server may run on one of these computers or a third one.

**How it works**:

- The application is designed to run on multiple physical machines
- Server can be deployed on Railway (cloud) or any machine on the network
- Clients connect to the server via IP address or domain name
- Each client runs independently in a web browser

**Code Snippet - Server Setup**:

```33:39:server/server.js
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
```

**Code Snippet - Client Connection**:

```67:72:client/src/App.tsx
    const newSocket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
```

**Code Snippet - Server URL Configuration**:

```82:90:client/src/components/LoginScreen.tsx
            <input
              id="serverUrl"
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder={window.location.protocol === 'https:' ? "https://your-server.railway.app" : "http://localhost:3001"}
              required
              className="p-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-base focus:outline-none focus:border-[#00C300] dark:focus:border-[#00E676] focus:bg-white dark:focus:bg-gray-800 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
            />
```

**Demonstration**:

- Run server on one machine (or Railway)
- Open client on multiple different computers
- Each client connects to the same server URL
- All clients can see each other in the online list

---

### **R2 (0.5): Socket Programming Only for Chat Messages**

**Requirement**: Chat messages between server and each client must be implemented using **Socket Programming only**.

**How it works**:

- All communication uses Socket.IO (WebSocket-based)
- No HTTP REST API for messages
- Real-time bidirectional communication via `socket.emit()` and `socket.on()`
- Messages sent as Socket.IO events, not HTTP requests

**Code Snippet - Server: Receiving Private Messages**:

```114:182:server/server.js
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
```

**Code Snippet - Server: Receiving Group Messages**:

```319:357:server/server.js
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
```

**Code Snippet - Client: Sending Private Messages**:

```306:309:client/src/components/ChatInterface.tsx
      socket.emit("privateMessage", {
        recipientId: activeChat.id,
        message: trimmedMessage,
      });
```

**Code Snippet - Client: Sending Group Messages**:

```329:332:client/src/components/ChatInterface.tsx
      socket.emit("groupMessage", {
        groupId: activeChat.id,
        message: trimmedMessage,
      });
```

**Code Snippet - Client: Receiving Messages**:

```79:155:client/src/components/ChatInterface.tsx
    socket.on("privateMessage", (messageData: PrivateMessageData) => {
      const {
        roomId,
        sender,
        message,
        timestamp,
        recipient,
        messageId,
        reactions,
      } = messageData;
      console.log("Received private message:", messageData);

      if (sender.socketId !== socket.id && recipient.socketId === socket.id) {
        const senderClient = clients.find(
          (c) => c.socketId === sender.socketId
        );
        if (
          senderClient &&
          (!activeChat ||
            activeChat.id !== sender.socketId ||
            activeChat.type !== "private")
        ) {
          console.log("Auto-opening chat with:", senderClient);
          setActiveChat({
            type: "private",
            id: sender.socketId,
            name: sender.name,
          });
        }
      }

      setMessages((prev) => {
        const newMessages = new Map(prev);
        const roomMessages = newMessages.get(roomId) || [];

        const existingIndex = roomMessages.findIndex(
          (msg) =>
            msg.messageId === messageId ||
            (msg.messageId?.startsWith("temp-") &&
              msg.message === message &&
              msg.sender === sender.name &&
              Math.abs(
                new Date(msg.timestamp).getTime() -
                  new Date(timestamp).getTime()
              ) < 2000)
        );

        if (existingIndex >= 0) {
          if (
            roomMessages[existingIndex].messageId?.startsWith("temp-") &&
            messageId
          ) {
            roomMessages[existingIndex] = {
              ...roomMessages[existingIndex],
              messageId,
              reactions:
                reactions || roomMessages[existingIndex].reactions || {},
            };
            newMessages.set(roomId, [...roomMessages]);
          }
        } else {
          console.log("Adding message to room:", roomId);
          newMessages.set(roomId, [
            ...roomMessages,
            {
              sender: sender.name,
              message,
              timestamp,
              isOwn: sender.socketId === socket.id,
              messageId,
              reactions: reactions || {},
            },
          ]);
        }
        return newMessages;
      });
    });
```

---

### **R3 (0.5): Each Client Must Have a Unique Name**

**Requirement**: Each client must have a unique name.

**How it works**:

- Server validates name uniqueness during registration
- Case-insensitive comparison (prevents "John" and "john")
- Returns error if name already exists
- Client must choose a different name to register

**Code Snippet - Server: Unique Name Validation**:

```51:78:server/server.js
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
```

**Code Snippet - Client: Registration**:

```77:87:client/src/App.tsx
      newSocket.emit('register', { name: name.trim(), age }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          setClientName(name.trim());
          setSocket(newSocket);
          setIsConnected(true);
          setError('');
        } else {
          setError(response.error || 'Registration failed');
          newSocket.disconnect();
        }
      });
```

---

### **R4 (0.5): Client List - See All Connected Clients**

**Requirement**: Each client can see a list of names of all clients that are currently connected to the server including its own name.

**How it works**:

- Server maintains a `Map` of all connected clients
- On registration, server sends full client list to new client
- Server broadcasts when clients join/leave
- Client updates its local state when receiving updates

**Code Snippet - Server: Sending Client List on Registration**:

```84:95:server/server.js
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
```

**Code Snippet - Server: Broadcasting Client Left**:

```473:476:server/server.js
      socket.broadcast.emit("clientLeft", {
        name: client.name,
        socketId: socket.id,
      });
```

**Code Snippet - Client: Receiving and Displaying Client List**:

```33:50:client/src/components/ChatInterface.tsx
    socket.on("clientList", (clientList: Client[]) => {
      console.log("Received client list:", clientList);
      setClients(clientList);
    });

    socket.on("clientJoined", (client: Client) => {
      setClients((prev) => {
        const exists = prev.find((c) => c.socketId === client.socketId);
        if (!exists) {
          return [...prev, client];
        }
        return prev;
      });
    });

    socket.on("clientLeft", (client: Client) => {
      setClients((prev) => prev.filter((c) => c.socketId !== client.socketId));
    });
```

**Code Snippet - Client: Displaying Client List**:

```30:68:client/src/components/ClientList.tsx
          clients.map((client) => (
            <div
              key={client.socketId}
              className={`flex items-center gap-3 p-2.5 md:p-3 rounded-lg cursor-pointer transition-colors border ${
                client.socketId === currentClientId
                  ? "bg-[#E8F5E9] dark:bg-gray-800 cursor-default border-[#00C300] dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              }`}
              onClick={() =>
                client.socketId !== currentClientId && onSelectClient(client)
              }
            >
              <div
                style={{
                  background: "#00C300",
                }}
                className="w-10 h-10 md:w-11 md:h-11 rounded-full text-white flex items-center justify-center font-semibold text-base md:text-lg flex-shrink-0"
              >
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-medium text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis ${
                    client.socketId === currentClientId
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {client.name}
                  {client.socketId === currentClientId && (
                    <span className="text-[#00C300] dark:text-[#00E676] text-xs md:text-sm font-semibold ml-1">
                      {" "}
                      (You)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
```

---

### **R5 (0.5): Separate Chat Rooms for Private and Group Messages**

**Requirement**: Each chat between clients (both **Private** and **Group message**) must have its own chat room.

**How it works**:

- **Private rooms**: Created using sorted socket IDs (`socket1-socket2`)
- **Group rooms**: Created using group ID (`group-1`, `group-2`)
- Server uses Socket.IO rooms (`socket.join(roomId)`)
- Messages are routed to specific rooms only
- Each room is isolated from others

**Code Snippet - Server: Private Room Creation**:

```131:140:server/server.js
    const roomId = [socket.id, recipientId].sort().join("-");

    if (!privateRooms.has(roomId)) {
      privateRooms.set(roomId, {
        participants: new Set([socket.id, recipientId]),
      });
    }

    socket.join(roomId);
    io.to(recipientId).socketsJoin(roomId);
```

**Code Snippet - Server: Group Room Creation**:

```214:227:server/server.js
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
```

**Code Snippet - Server: Sending Messages to Room**:

```175:177:server/server.js
    io.to(roomId).emit("privateMessage", messageData);
    socket.emit("privateMessage", messageData);
    io.to(recipientId).emit("privateMessage", messageData);
```

**Code Snippet - Server: Sending Messages to Group Room**:

```356:356:server/server.js
    io.to(groupId).emit("groupMessage", messageData);
```

**Code Snippet - Client: Message Storage by Room**:

```364:376:client/src/components/ChatInterface.tsx
  const getCurrentMessages = (): Message[] => {
    if (!activeChat) return [];

    let messageKey: string;
    if (activeChat.type === "private") {
      const roomId = [socket.id, activeChat.id].sort().join("-");
      messageKey = roomId;
    } else {
      messageKey = activeChat.id;
    }

    return messages.get(messageKey) || [];
  };
```

---

### **R6 (0.5): Chat Box and Chat Window for Each Room**

**Requirement**: Each chat room (both **Private** and **Group message**) must include a chat box for sending text messages and chat window for displaying the sent messages and new incoming messages.

**How it works**:

- Each `ChatRoom` component has:
  - **Chat window**: Displays all messages in that room
  - **Chat box**: Input field and send button for typing messages
- Messages are displayed in chronological order
- Auto-scrolls to latest message

**Code Snippet - Chat Window (Display Messages)**:

```85:165:client/src/components/ChatRoom.tsx
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[#F5F5F5] dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm md:text-base">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => {
            const messageKey = msg.messageId || `${msg.timestamp}-${index}`;
            const hasReactions =
              msg.reactions && Object.keys(msg.reactions).length > 0;

            return (
              <div
                key={messageKey}
                className={`max-w-[70%] md:max-w-[70%] flex flex-col gap-1 ${
                  msg.isOwn ? "self-end" : "self-start"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-bold text-xs md:text-sm ${
                      msg.isOwn ? "text-[#00C300] dark:text-[#00E676]" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {msg.sender}
                  </span>
                  {msg.isOwn && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                      You
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-auto">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <button
                  type="button"
                  onDoubleClick={() => handleDoubleClick(msg)}
                  className={`px-4 py-3 rounded-xl text-sm md:text-base leading-relaxed break-words cursor-pointer transition-opacity hover:opacity-90 text-left w-full border ${
                    msg.isOwn
                      ? "bg-[#DCF8C6] dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 rounded-br-sm shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 rounded-bl-sm"
                  }`}
                  title="Double-click to react"
                >
                  {formatText(msg.message)}
                </button>
                {hasReactions && (
                  <div
                    className={`flex flex-wrap gap-1.5 mt-1 ${
                      msg.isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    {Object.entries(msg.reactions || {}).map(
                      ([emoji, socketIds]) => {
                        const hasUserReacted =
                          socketIds.includes(currentSocketId);
                        return (
                          <div
                            key={emoji}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              hasUserReacted
                                ? "bg-red-500/20 dark:bg-red-500/30 border border-red-500/50 dark:border-red-500/60"
                                : "bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            <span className="text-sm">{emoji}</span>
                            <span className="text-gray-600 dark:text-gray-300 text-[10px]">
                              {socketIds.length}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
```

**Code Snippet - Chat Box (Send Messages)**:

```168:193:client/src/components/ChatRoom.tsx
      <form
        onSubmit={handleSubmit}
        className="p-5 border-t border-gray-200 dark:border-gray-800 flex gap-3 bg-white dark:bg-gray-900"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Type a message${
            chat.type === "private" ? " (private)" : " (group)"
          }...`}
          className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full text-sm md:text-base focus:outline-none focus:border-[#00C300] dark:focus:border-[#00E676] focus:bg-white dark:focus:bg-gray-800 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
          autoFocus
        />
        <button
          type="submit"
          disabled={!inputMessage.trim()}
          className={`px-6 md:px-8 py-3 text-white border-none rounded-full text-sm md:text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#00C300]/50 disabled:cursor-not-allowed disabled:transform-none min-w-[60px] md:min-w-[80px] ${
            inputMessage.trim()
              ? "bg-[#00C300] dark:bg-gray-700"
              : "bg-gray-400 dark:bg-gray-600"
          }`}
        >
          Send
        </button>
      </form>
```

---

### **R7 (1.0): Private Messages - Only Sender and Receiver See**

**Requirement**: Each client can send a direct text message to any clients in the list. **Only the sender and receiver can see the messages.**

**How it works**:

- Private messages are sent to a room containing only two participants
- Server validates sender and recipient exist
- Messages are only emitted to the specific room
- Other clients cannot see private messages

**Code Snippet - Server: Private Message Validation and Routing**:

```114:182:server/server.js
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
```

**Code Snippet - Client: Sending Private Message**:

```286:309:client/src/components/ChatInterface.tsx
    if (activeChat.type === "private") {
      const roomId = [socket.id, activeChat.id].sort().join("-");
      const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
      setMessages((prev) => {
        const newMessages = new Map(prev);
        const roomMessages = newMessages.get(roomId) || [];
        newMessages.set(roomId, [
          ...roomMessages,
          {
            sender: clientName,
            message: trimmedMessage,
            timestamp,
            isOwn: true,
            messageId: tempMessageId,
            reactions: {},
          },
        ]);
        return newMessages;
      });

      socket.emit("privateMessage", {
        recipientId: activeChat.id,
        message: trimmedMessage,
      });
    }
```

**Code Snippet - Client: Selecting Client for Private Chat**:

```258:269:client/src/components/ChatInterface.tsx
  const handlePrivateChat = (recipient: Client) => {
    if (recipient.socketId === socket.id) {
      alert("You cannot send a private message to yourself.");
      return;
    }
    setActiveChat({
      type: "private",
      id: recipient.socketId,
      name: recipient.name,
    });
    setSidebarOpen(false);
  };
```

---

### **R8 (1.0): Create Group with Only Creator as Member**

**Requirement**: Each client can create a chat group(s), which initially includes only themselves as a member.

**How it works**:

- When creating a group, only the creator's socket ID is added to `members` Set
- Other clients can see the group but are not automatically added
- Creator must explicitly join (though they're already a member)

**Code Snippet - Server: Group Creation**:

```184:257:server/server.js
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
      members: new Set([socket.id]), // KEY: Only creator is a member initially
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
```

**Code Snippet - Client: Creating Group**:

```28:67:client/src/components/GroupManager.tsx
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || isCreating) return;

    const minAge =
      hasMinimumAge && minimumAge.trim()
        ? Number.parseInt(minimumAge.trim(), 10)
        : undefined;

    if (
      hasMinimumAge &&
      (Number.isNaN(minAge as number) ||
        (minAge as number) < 1 ||
        (minAge as number) > 150)
    ) {
      alert("Please enter a valid minimum age (1-150)");
      return;
    }

    setIsCreating(true);
    socket.emit(
      "createGroup",
      {
        groupName: groupName.trim(),
        minimumAge: minAge,
      },
      (response: { success: boolean; group?: Group; error?: string }) => {
        setIsCreating(false);
        if (response.success && response.group) {
          onGroupCreated(response.group);
          setGroupName("");
          setHasMinimumAge(false);
          setMinimumAge("");
          setShowCreateForm(false);
        } else {
          alert(response.error || "Failed to create group");
        }
      }
    );
  };
```

---

### **R9 (1.0): See List of All Groups with Member List**

**Requirement**: Each client can see a list of all existing chat groups (with the member list) created by any clients.

**How it works**:

- Server maintains a `Map` of all groups
- On registration, server sends full group list with members
- Server broadcasts when groups are created/updated
- Client displays groups with member names

**Code Snippet - Server: Sending Group List on Registration**:

```97:111:server/server.js
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
```

**Code Snippet - Server: Broadcasting Group Created**:

```256:256:server/server.js
    io.emit("groupCreated", groupResponse);
```

**Code Snippet - Server: Broadcasting Group Updated**:

```315:316:server/server.js
    io.to(groupId).emit("groupUpdated", groupResponse);
    socket.broadcast.emit("groupUpdated", groupResponse);
```

**Code Snippet - Client: Receiving Group List**:

```52:70:client/src/components/ChatInterface.tsx
    socket.on("groupList", (groupList: Group[]) => {
      setGroups(groupList);
    });

    socket.on("groupCreated", (group: Group) => {
      setGroups((prev) => {
        const exists = prev.find((g) => g.groupId === group.groupId);
        if (!exists) {
          return [...prev, group];
        }
        return prev;
      });
    });

    socket.on("groupUpdated", (group: Group) => {
      setGroups((prev) =>
        prev.map((g) => (g.groupId === group.groupId ? group : g))
      );
    });
```

**Code Snippet - Client: Displaying Groups with Members**:

```236:247:client/src/components/GroupManager.tsx
                <div className="mb-2 text-gray-600 dark:text-gray-400 text-xs md:text-sm">
                  <small>
                    Members: {group.members.map((m) => m.name).join(", ")}
                  </small>
                  {group.minimumAge && (
                    <div className="mt-1">
                      <small className="text-[#00C300] dark:text-[#00E676] font-semibold">
                        Minimum age: {group.minimumAge}+
                      </small>
                    </div>
                  )}
                </div>
```

---

### **R10 (1.0): Clients Join Groups by Themselves**

**Requirement**: Clients can choose to join a group chat only by themselves; they are not added automatically by the group creator.

**How it works**:

- When a group is created, only the creator is a member
- Other clients see the group in the list but are not members
- Clients must click "Join Group" button to join
- Server validates age restrictions before allowing join
- Server adds client to group's `members` Set only after explicit join request

**Code Snippet - Server: Join Group Handler**:

```259:317:server/server.js
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

    group.members.add(socket.id); // Add client to members Set
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
```

**Code Snippet - Client: Join Group Button**:

```69:87:client/src/components/GroupManager.tsx
  const handleJoinGroup = (group: Group) => {
    const isMember = group.members.some((m) => m.socketId === currentClientId);
    if (isMember) {
      onSelectGroup(group);
      return;
    }

    socket.emit(
      "joinGroup",
      { groupId: group.groupId },
      (response: { success: boolean; group?: Group; error?: string }) => {
        if (response.success && response.group) {
          onGroupJoined(response.group);
        } else {
          alert(response.error || "Failed to join group");
        }
      }
    );
  };
```

**Code Snippet - Client: Displaying Join/Open Chat Button**:

```248:263:client/src/components/GroupManager.tsx
                <div className="flex gap-2">
                  {isMember ? (
                    <button
                      className="flex-1 px-3 py-1.5 border-none rounded-md text-xs md:text-sm font-medium cursor-pointer transition-colors bg-[#00C300] dark:bg-gray-700 text-white hover:bg-[#00B300] dark:hover:bg-gray-600"
                      onClick={() => onSelectGroup(group)}
                    >
                      Open Chat
                    </button>
                  ) : (
                    <button
                      className="flex-1 px-3 py-1.5 border-none rounded-md text-xs md:text-sm font-medium cursor-pointer transition-colors bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      onClick={() => handleJoinGroup(group)}
                    >
                      Join Group
                    </button>
                  )}
                </div>
```

---

### **R11 (1.0): Group Messages - Only Members Can See**

**Requirement**: Each client can send a text message to the group that they joined. **Only the members of the chat group can see the messages.**

**How it works**:

- Server validates that sender is a member of the group before accepting message
- Messages are only emitted to the group room (`io.to(groupId).emit()`)
- Only clients who have joined the group (and are in the room) receive messages
- Non-members cannot see group messages

**Code Snippet - Server: Group Message Validation**:

```319:357:server/server.js
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
```

**Code Snippet - Client: Sending Group Message**:

```310:333:client/src/components/ChatInterface.tsx
    } else if (activeChat.type === "group") {
      const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
      setMessages((prev) => {
        const newMessages = new Map(prev);
        const roomMessages = newMessages.get(activeChat.id) || [];
        newMessages.set(activeChat.id, [
          ...roomMessages,
          {
            sender: clientName,
            message: trimmedMessage,
            timestamp,
            isOwn: true,
            messageId: tempMessageId,
            reactions: {},
          },
        ]);
        return newMessages;
      });

      socket.emit("groupMessage", {
        groupId: activeChat.id,
        message: trimmedMessage,
      });
    }
```

**Code Snippet - Client: Receiving Group Messages**:

```157:206:client/src/components/ChatInterface.tsx
    socket.on("groupMessage", (messageData: GroupMessageData) => {
      const { groupId, sender, message, timestamp, messageId, reactions } =
        messageData;
      console.log("Received group message:", messageData);

      setMessages((prev) => {
        const newMessages = new Map(prev);
        const roomMessages = newMessages.get(groupId) || [];

        const existingIndex = roomMessages.findIndex(
          (msg) =>
            msg.messageId === messageId ||
            (msg.messageId?.startsWith("temp-") &&
              msg.message === message &&
              msg.sender === sender.name &&
              Math.abs(
                new Date(msg.timestamp).getTime() -
                  new Date(timestamp).getTime()
              ) < 2000)
        );

        if (existingIndex >= 0) {
          if (
            roomMessages[existingIndex].messageId?.startsWith("temp-") &&
            messageId
          ) {
            roomMessages[existingIndex] = {
              ...roomMessages[existingIndex],
              messageId,
              reactions:
                reactions || roomMessages[existingIndex].reactions || {},
            };
            newMessages.set(groupId, [...roomMessages]);
          }
        } else {
          newMessages.set(groupId, [
            ...roomMessages,
            {
              sender: sender.name,
              message,
              timestamp,
              isOwn: sender.socketId === socket.id,
              messageId,
              reactions: reactions || {},
            },
          ]);
        }
        return newMessages;
      });
    });
```

---

## 🎯 **Summary**

### **Data Structures Used**

- **Server**: `Map` for clients, groups, messages, privateRooms; `Set` for group members and room participants
- **Client**: `Array` for clients and groups; `Map<string, Message[]>` for messages organized by room/group

### **Key Features**

- ✅ Real-time bidirectional communication via Socket.IO
- ✅ Unique client names with validation
- ✅ Separate rooms for each private/group chat
- ✅ Private messages visible only to sender and receiver
- ✅ Group creation with only creator as initial member
- ✅ Self-service group joining
- ✅ Group messages visible only to members
- ✅ Real-time updates for client list and group list

### **Technology Stack**

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Communication**: WebSocket (Socket.IO)

---

## 📝 **Presentation Tips**

1. **Start with Architecture**: Show the overall system design (R1)
2. **Demonstrate Socket Programming**: Show network tab or console logs (R2)
3. **Show Unique Names**: Try registering with duplicate name (R3)
4. **Show Client List**: Open multiple clients and show the list updating (R4)
5. **Show Separate Rooms**: Open multiple chats and show messages are isolated (R5, R6)
6. **Show Private Messages**: Send private message and verify only 2 clients see it (R7)
7. **Show Group Creation**: Create a group and show only creator is member (R8)
8. **Show Group List**: Display all groups with member lists (R9)
9. **Show Self-Join**: Have another client join the group (R10)
10. **Show Group Messages**: Send group message and verify only members see it (R11)

---

**Good luck with your presentation! 🚀**
