# VibePay Vercel Deployment Guide

## 🚀 Vercel Environment Variables Setup

Before deploying, make sure to set these environment variables in your Vercel dashboard:

### Required Variables:

1. **`DATABASE_URL`**
   - Your production database connection string
   - Example for PostgreSQL: `postgresql://username:password@hostname:port/database`
   - Example for MySQL: `mysql://username:password@hostname:port/database`

2. **`BETTER_AUTH_SECRET`**
   - A random secret key for authentication
   - Generate with: `openssl rand -base64 32`
   - Or use any 32+ character random string

3. **`BETTER_AUTH_URL`**
   - Your production URL
   - Example: `https://your-app-name.vercel.app`

### Optional Variables:

4. **`MASTER_WALLET_PK`** (for real blockchain transactions)
   - Your Sepolia testnet private key
   - Only needed if you want real blockchain transactions
   - Without this, the app runs in demo mode

5. **`NODE_ENV`**
   - Set to `production` for production deployments
   - Vercel sets this automatically

## 📋 Steps to Deploy:

### 1. Push Your Changes
```bash
git add .
git commit -m "Fix Vercel Prisma deployment"
git push origin main
```

### 2. Set Environment Variables in Vercel
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable listed above

### 3. Deploy
- Vercel will automatically deploy when you push to main
- Or manually trigger a deployment from the Vercel dashboard

## 🔍 Build Process

The updated build process will:
1. Run `prisma generate` to create the Prisma Client
2. Run `next build` to build the Next.js application
3. The `postinstall` script ensures Prisma Client is always generated after dependency installation

## 🐛 Troubleshooting

### If deployment still fails:
1. Check the build logs in Vercel for specific errors
2. Ensure all environment variables are set correctly
3. Verify your database is accessible from Vercel
4. Make sure your database schema is up to date

### Database Setup:
- Make sure your production database has the latest schema
- Run `npx prisma db push` against your production database if needed
- Or use `npx prisma migrate deploy` if you're using migrations

## ✅ Deployment Success

After successful deployment, your VibePay app should be fully functional with:
- ✅ Authentication system working
- ✅ Database connections established  
- ✅ Wallet creation and management
- ✅ Deposit functionality (demo mode without MASTER_WALLET_PK)
- ✅ Transaction processing
- ✅ MCP integration for Claude/ChatGPT

Your app will be available at: `https://your-app-name.vercel.app`
