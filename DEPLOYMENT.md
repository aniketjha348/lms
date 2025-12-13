# AWS Deployment Guide for LMS

## Architecture

```
User → CloudFront → S3 (React Frontend)
     ↓
     → EC2 (Node.js Backend API)
     ↓
     → S3 (Video Storage)
     → MongoDB Atlas (Database)
```

## Prerequisites

- AWS Account with $110 credits
- GitHub repository with your code
- MongoDB Atlas database (free tier)

---

## Step 1: Create S3 Buckets

### 1.1 Frontend Bucket (for React app)

1. Go to S3 → Create Bucket
2. Name: `lms-frontend-[your-name]`
3. Region: `ap-south-1`
4. **Uncheck** "Block all public access"
5. Enable static website hosting:
   - Index document: `index.html`
   - Error document: `index.html`

### 1.2 Videos Bucket (for video storage)

1. Create another bucket: `lms-videos-[your-name]`
2. **Uncheck** "Block all public access"
3. Add bucket policy for public read:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::lms-videos-[your-name]/*"
    }
  ]
}
```

---

## Step 2: Create CloudFront Distribution

1. Go to CloudFront → Create Distribution
2. Origin domain: Select your frontend S3 bucket
3. Origin access: **Origin Access Control (OAC)**
4. Create new OAC
5. Default root object: `index.html`
6. Create distribution
7. **Copy the policy** and add to S3 bucket

### Custom Error Pages (for React Router)

- Go to Error Pages tab
- Create custom error response:
  - HTTP error code: 403
  - Response page path: `/index.html`
  - HTTP response code: 200

---

## Step 3: Launch EC2 Instance

1. Go to EC2 → Launch Instance
2. Name: `lms-backend`
3. AMI: Amazon Linux 2023
4. Instance type: `t2.micro` (free tier)
5. Key pair: Create new or use existing
6. Security Group:
   - SSH (22) from your IP
   - HTTP (80) from anywhere
   - Custom TCP (5000) from anywhere
7. Launch instance

### Install CodeDeploy Agent on EC2

SSH into your instance and run:

```bash
sudo yum update -y
sudo yum install -y ruby wget
cd /home/ec2-user
wget https://aws-codedeploy-ap-south-1.s3.ap-south-1.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
sudo systemctl start codedeploy-agent
```

---

## Step 4: Create IAM Roles

### 4.1 EC2 Role (for CodeDeploy)

1. IAM → Roles → Create Role
2. Use case: EC2
3. Policies:
   - `AmazonEC2RoleforAWSCodeDeploy`
   - `AmazonS3ReadOnlyAccess`
4. Name: `EC2CodeDeployRole`
5. Attach to EC2 instance

### 4.2 CodeDeploy Service Role

1. Create Role → CodeDeploy
2. Use case: CodeDeploy
3. Name: `CodeDeployServiceRole`

### 4.3 CodeBuild Service Role

1. Create Role → CodeBuild
2. Policies:
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
   - `CloudWatchLogsFullAccess`
3. Name: `CodeBuildServiceRole`

---

## Step 5: Setup CodePipeline

### 5.1 Backend Pipeline

1. CodePipeline → Create Pipeline
2. Name: `lms-backend-pipeline`
3. Source: GitHub (connect your repo)
4. Branch: `main`
5. Build: CodeBuild
   - Create project: `lms-backend-build`
   - Use `buildspec.yml`
6. Deploy: CodeDeploy
   - Create application: `lms-backend`
   - Deployment group: `lms-backend-group`
   - Select your EC2 instance

### 5.2 Frontend Pipeline

1. Create another pipeline: `lms-frontend-pipeline`
2. Source: Same GitHub repo
3. Build: CodeBuild
   - Create project: `lms-frontend-build`
   - Use `buildspec-frontend.yml`
   - Environment variables:
     - `FRONTEND_BUCKET`: your-frontend-bucket-name
     - `CLOUDFRONT_DISTRIBUTION_ID`: your-distribution-id
4. Deploy: Skip (S3 deploy happens in build phase)

---

## Step 6: Environment Variables

### On EC2, create `/home/ec2-user/lms/server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://your-cloudfront-domain.cloudfront.net

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=lms-videos-your-name

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

### In client/.env.production:

```env
VITE_API_URL=http://your-ec2-public-ip:5000/api
```

---

## Step 7: Update Client for Production

Update `client/vite.config.js` if needed:

```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
  },
});
```

---

## Step 8: Deploy

1. Commit all changes to GitHub
2. Push to `main` branch
3. CodePipeline will automatically:
   - Build backend → Deploy to EC2
   - Build frontend → Deploy to S3 → Invalidate CloudFront

---

## Monitoring & Logs

- **EC2 Logs**: `pm2 logs lms-backend`
- **CodePipeline**: Check pipeline status in AWS Console
- **CloudWatch**: View logs for debugging

---

## Estimated Monthly Cost

| Service       | Cost              |
| ------------- | ----------------- |
| EC2 t2.micro  | ~$8/month         |
| S3 Storage    | ~$1-2/month       |
| CloudFront    | ~$0.50/month      |
| Data Transfer | ~$2-3/month       |
| **Total**     | **~$12-15/month** |

With $110 credits = **7-9 months** of hosting!

---

## Troubleshooting

### CodeDeploy fails

- Check CodeDeploy agent: `sudo systemctl status codedeploy-agent`
- Check logs: `tail -f /var/log/aws/codedeploy-agent/codedeploy-agent.log`

### App not accessible

- Check security group allows port 5000
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs`

### CloudFront 403 errors

- Ensure OAC policy is added to S3 bucket
- Check custom error pages configuration
