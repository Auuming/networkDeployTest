# Quick Start Guide

## 🚀 Fast Setup (3 Steps)

### 1. Install Dependencies

**Terminal 1 - Server:**
```bash
cd server
npm install
```

**Terminal 2 - Client:**
```bash
cd client
npm install
```

### 2. Start the Server

**Terminal 1:**
```bash
cd server
npm start
```

Wait for: `🚀 Chat Server running on http://localhost:3001`

### 3. Start the Client

**Terminal 2:**
```bash
cd client
npm run dev
```

Open browser to: `http://localhost:3000`

## 🌐 For Network Access (Friends on Other Devices)

### Find Your IP Address

**macOS/Linux:**
```bash
./get-ip.sh
```
or
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address"

### Share URLs

If your IP is `192.168.1.100`:
- **Server URL**: `http://192.168.1.100:3001`
- **Client URL**: `http://192.168.1.100:3000`

Friends should:
1. Open browser on their device
2. Go to `http://192.168.1.100:3000`
3. Enter their unique name
4. Enter server URL: `http://192.168.1.100:3001`
5. Click "Connect"

## ✅ Verify It Works

1. Open 2 browser tabs/windows
2. Connect with different names
3. Click on a client name to start private chat
4. Create a group and send messages

## 🆘 Troubleshooting

**Can't connect?**
- Make sure server is running
- Check server URL is correct
- Ensure same network for all devices

**Port already in use?**
- Change PORT in server: `PORT=4000 npm start`
- Update client server URL accordingly

