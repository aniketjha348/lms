# Backend EC2 Deployment - Step by Step

## Step 1: Create EC2 Instance (AWS Console)

1. Go to **AWS Console** → **EC2** → **Launch Instance**
2. Configure:
   - **Name**: `lms-backend`
   - **AMI**: Amazon Linux 2023
   - **Instance type**: `t2.micro` (free tier)
   - **Key pair**: Create new → Download `.pem` file
   - **Security Group**: Allow:
     - SSH (22) from your IP
     - HTTP (80) from anywhere
     - Custom TCP (5000) from anywhere
3. **Launch Instance**
4. Note the **Public IP Address**

---

## Step 2: Connect to EC2

```bash
# Windows: Use Git Bash or WSL
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

---

## Step 3: Install Node.js & PM2 (Run on EC2)

```bash
# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Verify
node --version
pm2 --version
```

---

## Step 4: Clone Your Repo (Run on EC2)

```bash
cd /home/ec2-user

# Option A: If public repo
git clone https://github.com/YOUR_USERNAME/lms.git

# Option B: If private repo, use personal access token
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/lms.git
```

---

## Step 5: Create .env File (Run on EC2)

```bash
cd /home/ec2-user/lms/server
nano .env
```

Paste this content (update values):

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_super_secret_key_here
FRONTEND_URL=http://lms-frontend-aniket-2024.s3-website.ap-south-1.amazonaws.com

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=lms-videos-aniket-2024

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
```

Save: `Ctrl+O`, Exit: `Ctrl+X`

---

## Step 6: Install Dependencies & Start (Run on EC2)

```bash
cd /home/ec2-user/lms/server
npm install
pm2 start server.js --name lms-backend
pm2 save
pm2 startup
```

---

## Step 7: Update Frontend API URL

After EC2 is running, update client/.env.production:

```
VITE_API_URL=http://YOUR_EC2_PUBLIC_IP:5000/api
```

Then rebuild and redeploy frontend:

```bash
cd client
npm run build
aws s3 sync dist/ s3://lms-frontend-aniket-2024 --delete
```

---

## Useful PM2 Commands

```bash
pm2 status          # Check status
pm2 logs            # View logs
pm2 restart all     # Restart app
pm2 stop all        # Stop app
```

---

## Troubleshooting

1. **Can't connect to EC2**: Check Security Group allows SSH
2. **API not accessible**: Check port 5000 is open in Security Group
3. **MongoDB error**: Check MONGODB_URI is correct
