#!/bin/bash
set -e

echo "=== Before Install ==="

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Create app directory
mkdir -p /home/ec2-user/lms/server

echo "Before Install completed"
