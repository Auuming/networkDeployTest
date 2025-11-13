#!/bin/bash

# Script to get your local IP address for network access

echo "Finding your local IP address..."
echo ""

# Try different methods based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ip route get 1 | awk '{print $7; exit}' 2>/dev/null)
else
    IP=$(ipconfig 2>/dev/null | grep "IPv4" | head -1 | awk '{print $NF}')
fi

if [ -z "$IP" ]; then
    echo "❌ Could not automatically detect IP address"
    echo ""
    echo "Please find your IP address manually:"
    echo "  macOS/Linux: ifconfig | grep 'inet '"
    echo "  Windows: ipconfig"
else
    echo "✅ Your IP address is: $IP"
    echo ""
    echo "Server URL: http://$IP:3001"
    echo "Client URL: http://$IP:3000"
    echo ""
    echo "Share these URLs with friends on the same network!"
fi

