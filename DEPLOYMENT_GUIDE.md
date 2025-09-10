# 🚀 QR Attendance System - Render Deployment Guide

## Prerequisites
- GitHub account
- Render account (free)
- MongoDB Atlas account (already configured)

## Step 1: Prepare Your Code

### 1.1 Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit - QR Attendance System"
```

### 1.2 Create GitHub Repository
1. Go to GitHub.com
2. Click "New Repository"
3. Name: `qr-attendance-system`
4. Make it Public (required for free Render)
5. Don't initialize with README
6. Click "Create Repository"

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/qr-attendance-system.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Render

### 2.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Connect your GitHub account

### 2.2 Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select `qr-attendance-system` repository

### 2.3 Configure Service Settings
- **Name**: `qr-attendance-system`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 2.4 Environment Variables
Add these environment variables in Render dashboard:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://dcdaka4:zRcEpN!96.epUUv@cluster0.ocodntp.mongodb.net/qr-attendance?retryWrites=true&w=majority&appName=Cluster0` |
| `PORT` | `3000` |

### 2.5 Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your app will be available at: `https://your-app-name.onrender.com`

## Step 3: Test Your Deployment

### 3.1 Main Interface
- URL: `https://your-app-name.onrender.com`
- Test: Add courses, generate QR codes

### 3.2 Student Scanner
- URL: `https://your-app-name.onrender.com/student`
- Test: Scan QR codes, mark attendance

### 3.3 API Endpoints
- Dashboard: `https://your-app-name.onrender.com/api/dashboard`
- Courses: `https://your-app-name.onrender.com/api/courses`
- Students: `https://your-app-name.onrender.com/api/students`

## Step 4: Custom Domain (Optional)

### 4.1 Add Custom Domain
1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain
4. Update DNS records as instructed

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check `package.json` has correct scripts
   - Ensure all dependencies are listed

2. **App Crashes**
   - Check logs in Render dashboard
   - Verify environment variables

3. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas

4. **QR Codes Not Working**
   - Ensure HTTPS is enabled (Render provides this)
   - Check camera permissions on mobile

## Monitoring

### Render Dashboard
- View logs in real-time
- Monitor performance
- Check deployment status

### MongoDB Atlas
- Monitor database usage
- View connection metrics
- Check data storage

## Security Notes

1. **Environment Variables**: Never commit sensitive data
2. **MongoDB**: Use connection string with proper authentication
3. **CORS**: Configured for cross-origin requests
4. **HTTPS**: Automatically provided by Render

## Cost

- **Render Free Tier**: 750 hours/month (enough for testing)
- **MongoDB Atlas**: Free tier available
- **Total Cost**: $0 for small to medium usage

## Support

If you encounter issues:
1. Check Render logs
2. Verify environment variables
3. Test locally first
4. Check MongoDB Atlas connection

## Success! 🎉

Your QR Code Attendance System is now live and accessible from anywhere in the world!
