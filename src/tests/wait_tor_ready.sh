#!/bin/bash

# Set the SOCKS port
SOCKS_PORT=9150

echo "Checking if Tor SOCKS port is ready..."

while true; do
    # Check if Tor SOCKS port is responding using curl
    if curl --socks5-hostname 127.0.0.1:$SOCKS_PORT --connect-timeout 2 -s https://check.torproject.org/api/ip | grep -q '"IsTor":true'; then
        echo "Tor SOCKS port is ready!"
        exit 0
    fi
    
    echo "Waiting for Tor SOCKS port to be ready..."
    sleep 2
done