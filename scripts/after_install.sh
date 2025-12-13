#!/bin/bash
set -e

echo "=== After Install ==="

cd /home/ec2-user/lms/server

# Set ownership
chown -R ec2-user:ec2-user /home/ec2-user/lms

# Install dependencies if package.json changed
npm ci --production

echo "After Install completed"
