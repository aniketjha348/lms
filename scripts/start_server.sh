#!/bin/bash
set -e

echo "=== Starting Server ==="

cd /home/ec2-user/lms/server

# Start with PM2
sudo -u ec2-user pm2 start server.js --name "lms-backend" --update-env

# Save PM2 process list
sudo -u ec2-user pm2 save

# Setup PM2 startup
pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo "Server started successfully"
