# Vercel Deployment Setup

## Environment Variables Required

Go to your Vercel project → Settings → Environment Variables and add the following:

### Database
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
DATA_CENTER_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-datacenter?retryWrites=true&w=majority
```

### Authentication
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

### Encryption
```
ENCRYPTION_KEY=your-32-character-encryption-key
```

### CORS
```
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-other-domain.com
```

### Email Configuration (Optional)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=CRM System
```

### API Keys (Optional)
```
ZEROBOUNCE_API_KEY=your-key
NUMVERIFY_API_KEY=your-key
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
```

### Environment
```
NODE_ENV=production
```

## Deployment Steps

1. **Push your code to Git**
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push
   ```

2. **Set Environment Variables in Vercel**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add all required variables above
   - Make sure to add them for "Production", "Preview", and "Development" environments

3. **Redeploy**
   - Vercel will auto-deploy on git push
   - Or manually trigger a redeploy from the Vercel dashboard

4. **Check Deployment**
   - Visit `https://your-backend.vercel.app/health`
   - Should return JSON with server status

## Troubleshooting

### Function Crashes
- Check Vercel Function Logs: Project → Deployments → Click deployment → Functions tab
- Ensure all environment variables are set
- Check database connection strings are correct

### CORS Issues
- Ensure `ALLOWED_ORIGINS` includes your frontend URL
- The backend accepts any `*.vercel.app` domain automatically

### Database Connection Issues
- Ensure MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
- Check connection string format
- Verify username/password don't have special characters that need URL encoding

### Timeout Issues
- Vercel serverless functions have a 10-second timeout on Hobby plan
- Consider upgrading to Pro for 60-second timeout
- Or deploy long-running services elsewhere (Railway, Render)

## Important Notes

### Socket.io Limitations
- Socket.io requires persistent connections
- Vercel serverless functions don't support WebSockets
- If you need real-time features, deploy Socket.io server separately on:
  - Railway.app
  - Render.com
  - Heroku
  - Or use managed services like Pusher/Ably

### Background Jobs
- IMAP idle connections and cron jobs won't work on Vercel
- These require persistent processes
- Deploy these separately or use:
  - Vercel Cron Jobs (for scheduled tasks)
  - External job queue services (BullMQ, etc.)

### File Uploads
- Files uploaded to serverless functions are stored in `/tmp` (temporary)
- Files in `/tmp` are deleted when the function execution completes
- **IMPORTANT**: For production, you MUST use cloud storage for persistent uploads:
  - **AWS S3** (Recommended)
  - **Cloudinary** (For images)
  - **Vercel Blob** (Vercel's storage solution)
  - **Google Cloud Storage**
  - **Azure Blob Storage**

- Current behavior:
  - Local development: Files saved to `uploads/` directory
  - Vercel production: Files saved to `/tmp/` (temporary, will be deleted)

- Routes affected by file uploads:
  - `/api/leads` - Bulk import Excel/CSV files
  - `/api/purchase-orders` - PO document uploads
  - `/api/quotations` - PDF generation
  - `/api/invoices` - PDF generation
