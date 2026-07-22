# LMS Deployment Guide

This guide covers how to deploy your LMS MERN application. 

I have already configured your codebase for a **Monolithic Deployment**. This is the easiest and most cost-effective way to deploy a MERN stack. It involves serving your Vite React frontend directly from your Express backend on a single platform (like [Render](https://render.com) or Heroku).

## Required Services
Before you begin, ensure you have the following third-party services set up:
1. **MongoDB Atlas**: You need a cloud MongoDB database (a free cluster is fine). Get your connection string (`MONGODB_URI`).
2. **AWS S3** (Optional but recommended): For file uploads. You'll need:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `AWS_BUCKET_NAME`

## Method 1: Monolithic Deployment on Render (Recommended)

Render is a popular platform that makes deploying Node.js apps very easy. It will build your frontend and run your backend in one go.

### Steps:
1. Push your entire project (both `frontend` and `backend` folders, plus the new root `package.json`) to a GitHub repository.
2. Go to [Render.com](https://render.com) and sign in with GitHub.
3. Click **New +** and select **Web Service**.
4. Connect the GitHub repository you just created.
5. Configure the Web Service:
   - **Name**: `lms-app` (or whatever you prefer)
   - **Runtime**: `Node`
   - **Build Command**: `npm run build` *(this runs the script in the root package.json which installs all dependencies and builds the frontend)*
   - **Start Command**: `npm start` *(this starts your backend server)*
6. Under **Environment Variables**, add the following:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb+srv://<user>:<password>@cluster...` (your Atlas URI)
   - `JWT_SECRET` = `your_super_secret_jwt_key`
   - `AWS_ACCESS_KEY_ID` = `your_aws_key` *(if using S3)*
   - `AWS_SECRET_ACCESS_KEY` = `your_aws_secret` *(if using S3)*
   - `AWS_REGION` = `your_aws_region` *(if using S3)*
   - `AWS_BUCKET_NAME` = `your_aws_bucket_name` *(if using S3)*
7. Click **Create Web Service**. 

Render will now build your frontend and start your backend. When you visit the provided `.onrender.com` URL, your Express server will serve the React frontend, and API calls will work seamlessly!

> [!TIP]
> **How does it work?**
> I modified `backend/src/server.js` to automatically serve the `frontend/dist` folder when `NODE_ENV=production`. I also added a root `package.json` with a `build` script that builds the React app before the server starts.

---

## Method 2: Split Deployment (Vercel + Render)

If you prefer to host your frontend on a CDN like Vercel and your backend separately, follow these steps.

### Backend Deployment (Render)
1. In Render, create a Web Service as above, but set the **Root Directory** to `backend`.
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. Add the same Environment Variables, plus optionally set `PORT=5000`.
5. Once deployed, copy your backend URL (e.g., `https://lms-backend.onrender.com`).

### Frontend Deployment (Vercel)
1. Go to [Vercel](https://vercel.com) and create a New Project.
2. Select your repository, and set the **Root Directory** to `frontend`.
3. Vercel will automatically detect that it's a Vite project.
4. **Important Code Change needed for this method:** You will need to update `frontend/src/services/api.js` to point to your new backend URL:
   ```javascript
   const api = axios.create({
     // Change this to your Render backend URL for production
     baseURL: import.meta.env.PROD ? 'https://lms-backend.onrender.com/api' : '', 
   });
   ```
5. Deploy the frontend on Vercel.

> [!WARNING]
> If you use the Split Deployment method, you will likely encounter **CORS** issues. You will need to update `backend/src/server.js` to allow requests from your Vercel frontend URL:
> `app.use(cors({ origin: 'https://your-frontend-url.vercel.app' }));`
