# Socket Chat Application

A real-time chat application built with Socket.IO supporting private messaging and group chats. Works on multiple devices on the same network.

## Features

- ✅ Unique client names
- ✅ View all connected clients
- ✅ Private messaging between clients
- ✅ Create and join group chats
- ✅ Real-time message updates
- ✅ Network access from multiple devices

## Quick Start

### Prerequisites

- Node.js (v16+)
- npm

### Installation

1. **Install server dependencies:**

```bash
cd server
npm install
```

2. **Install client dependencies:**

```bash
cd ../client
npm install
```

### Running the Application

1. **Start the server** (Terminal 1):

```bash
cd server
npm start
```

Server runs on `http://localhost:3001`

2. **Start the client** (Terminal 2):

```bash
cd client
npm run dev
```

Client runs on `http://localhost:3000`

3. **Open in browser:**
   - Local: `http://localhost:3000`
   - Network: `http://<YOUR_IP>:3000` (for other devices)

## Usage

### Connecting

1. Enter a **unique name** (must be different from other users)
2. Enter **Server URL**:
   - Local: `http://localhost:3001`
   - Network: `http://<SERVER_IP>:3001`
3. Click "Connect to Server"

### Private Messages

- Click on any client name in the "Online Users" list
- Type and send messages
- Only you and the recipient can see the conversation

### Group Chats

- **Create**: Click "+ New" in Groups section, enter name, click "Create"
- **Join**: Click "Join Group" on any existing group
- **Chat**: Open the group and send messages to all members

## Network Access

### Finding Your IP Address

**macOS/Linux:**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**

```bash
ipconfig
```

Look for "IPv4 Address"

### Connecting from Other Devices

1. Ensure all devices are on the same Wi-Fi network
2. Use the server computer's IP address:
   - Server URL: `http://<SERVER_IP>:3001`
   - Client URL: `http://<SERVER_IP>:3000`
3. Configure firewall if needed (allow ports 3000 and 3001)

## Project Structure

```
NW_Project/
├── server/
│   ├── server.js          # Socket.IO server
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## Configuration

### Server

```bash
PORT=3001 npm start  # Change port (default: 3001)
```

### Client

Server URL can be changed in the login screen.

## Troubleshooting

- **Can't connect?** Verify server is running and URL is correct
- **Name already taken?** Choose a different unique name
- **Network access not working?** Check firewall settings and ensure same network
- **Messages not appearing?** Check browser console for errors

## Technology Stack

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: React + TypeScript + Tailwind CSS
- **Communication**: WebSocket (Socket.IO)

---

Built for Socket Programming Term Project
