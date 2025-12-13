#!/bin/bash
cd /c/Users/aniket/Desktop/lms
cat lms-backend-key.pem | tr -d '\r' > /tmp/lms-key.pem
chmod 400 /tmp/lms-key.pem
scp -i /tmp/lms-key.pem -o StrictHostKeyChecking=no -r server ec2-user@13.200.242.186:/home/ec2-user/
