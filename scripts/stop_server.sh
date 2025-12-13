#!/bin/bash

echo "=== Stopping Server ==="

# Stop PM2 process if running
sudo -u ec2-user pm2 stop lms-backend 2>/dev/null || true
sudo -u ec2-user pm2 delete lms-backend 2>/dev/null || true

echo "Server stopped"
