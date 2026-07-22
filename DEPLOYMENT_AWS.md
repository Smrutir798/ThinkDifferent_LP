# AWS Deployment Guide for ThinkDifferent LMS

This guide details how to deploy your fullstack MERN application on Amazon Web Services (AWS).

---

## Option 1: AWS App Runner (Recommended - Serverless & Containerized)

AWS App Runner is the easiest serverless way to run containerized web applications on AWS. It handles SSL certificates, domain management, scaling, and load balancing automatically.

### Steps:
1. **Push your code to GitHub** (ensure root `Dockerfile` and `.dockerignore` are included).
2. Open the **AWS App Runner Console** > Click **Create an App Runner service**.
3. Under **Source**:
   - Select **Source code repository** and connect your GitHub account.
   - Select your repository and main branch.
4. Under **Deployment settings**: Select **Automatic** (deploys on every git push).
5. Under **Build settings**:
   - Select **Use a Dockerfile**.
   - Build command: Left empty (uses Dockerfile).
   - Port: `8080` (or `5000`).
6. Under **Configure service**:
   - **Environment variables**:
     - `NODE_ENV` = `production`
     - `MONGODB_URI` = `mongodb+srv://<user>:<password>@cluster...`
     - `JWT_SECRET` = `your_jwt_secret_key`
     - `SMTP_USER` = `your_email@gmail.com`
     - `SMTP_PASS` = `your_app_password`
7. Click **Create & Deploy**. AWS App Runner will build the Docker container and give you a secure `https://xxx.awsapprunner.com` URL.

---

## Option 2: AWS Elastic Beanstalk (Node.js Managed Service)

Elastic Beanstalk is AWS's platform-as-a-service (PaaS) for Node.js applications.

### Steps using AWS CLI / EB CLI:

1. **Install EB CLI:**
   ```bash
   pip install awsebcli
   ```

2. **Initialize Elastic Beanstalk Project:**
   ```bash
   eb init -p node.js-20 lms-app --region us-east-1
   ```

3. **Create Environment & Deploy:**
   ```bash
   eb create lms-env
   ```

4. **Set Environment Variables:**
   ```bash
   eb setenv NODE_ENV=production MONGODB_URI="mongodb+srv://..." JWT_SECRET="your_secret"
   ```

---

## Option 3: AWS EC2 (Virtual Machine with PM2 & Nginx)

If you prefer full control over an Ubuntu server instance:

### 1. Launch EC2 Instance
- Go to EC2 Console > Launch Instance.
- Choose **Ubuntu 22.04 LTS**.
- Instance type: `t3.small` (or `t2.micro` for free tier).
- Configure Security Group: Allow HTTP (80), HTTPS (443), and SSH (22).

### 2. Connect & Setup Server
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# Update & Install Node.js 20 & Git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx

# Install PM2 globally
sudo npm install -g pm2
```

### 3. Clone & Build App
```bash
git clone https://github.com/YOUR_USER/YOUR_REPO.git
cd YOUR_REPO

# Install & Build
npm run build
```

### 4. Start App with PM2
```bash
# Create ecosystem file or run directly:
pm2 start npm --name "lms-app" -- start

# Save PM2 process list so it restarts on reboot
pm2 save
pm2 startup
```

### 5. Configure Nginx Reverse Proxy
Edit `/etc/nginx/sites-available/default`:
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Restart Nginx:
```bash
sudo systemctl restart nginx
```
