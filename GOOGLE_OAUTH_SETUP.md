# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth 2.0 authentication for your CRM application.

## Prerequisites
- A Google account
- Access to Google Cloud Console

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** dropdown at the top
3. Click **"New Project"**
4. Enter project details:
   - **Project name:** CRM Multi-Tenant App (or your preferred name)
   - **Organization:** (Optional) Select if applicable
5. Click **"Create"**
6. Wait for the project to be created (usually takes a few seconds)

---

## Step 2: Enable Google+ API

1. In the left sidebar, navigate to **"APIs & Services"** → **"Library"**
2. In the search bar, type: **"Google+ API"**
3. Click on **"Google+ API"** from the results
4. Click the **"Enable"** button
5. Wait for the API to be enabled

---

## Step 3: Configure OAuth Consent Screen

1. In the left sidebar, go to **"APIs & Services"** → **"OAuth consent screen"**

2. **Choose User Type:**
   - Select **"External"** (for public use)
   - Click **"Create"**

3. **App Information:**
   - **App name:** Your CRM Name (e.g., "CRM Platform")
   - **User support email:** Your email address
   - **App logo:** (Optional) Upload your app logo
   - **Application home page:** `http://localhost:3000` (for development)
   - **Application privacy policy link:** (Optional) Add if you have one
   - **Application terms of service link:** (Optional) Add if you have one

4. **Developer Contact Information:**
   - **Email addresses:** Add your email

5. Click **"Save and Continue"**

6. **Scopes:**
   - Click **"Add or Remove Scopes"**
   - Select the following scopes:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `openid`
   - Click **"Update"**
   - Click **"Save and Continue"**

7. **Test Users:** (Optional for development)
   - Add test user emails if in testing mode
   - Click **"Save and Continue"**

8. **Summary:**
   - Review your configuration
   - Click **"Back to Dashboard"**

---

## Step 4: Create OAuth 2.0 Credentials

1. In the left sidebar, go to **"APIs & Services"** → **"Credentials"**

2. Click **"Create Credentials"** dropdown at the top
3. Select **"OAuth client ID"**

4. **Application Type Configuration:**
   - **Application type:** Select **"Web application"**
   - **Name:** CRM OAuth Client (or your preferred name)

5. **Authorized JavaScript origins:**
   Add the following URLs (one per line):
   ```
   http://localhost:3000
   http://localhost:3001
   https://yourdomain.com
   ```
   *(Replace `yourdomain.com` with your actual production domain)*

6. **Authorized redirect URIs:**
   Add the following URLs (one per line):
   ```
   http://localhost:4000/api/auth/google/callback
   http://localhost:5000/api/auth/google/callback
   https://api.yourdomain.com/api/auth/google/callback
   ```
   *(Adjust ports and domains based on your setup)*

7. Click **"Create"**

8. **Save Your Credentials:**
   - A popup will appear with your **Client ID** and **Client Secret**
   - **IMPORTANT:** Copy both values immediately
   - Click **"OK"**

---

## Step 5: Add Credentials to Your Application

### Backend Configuration

1. Open your backend `.env` file:
   ```
   C:\Users\ANAND RAJ\OneDrive\Desktop\crm-orbit-1.0\crm-v1\backend\.env
   ```

2. Add the following environment variables:
   ```env
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

   # Frontend URL (for OAuth redirects)
   FRONTEND_URL=http://localhost:3000
   ```

3. Replace the placeholder values:
   - `your_client_id_here` → Your actual Client ID from Step 4
   - `your_client_secret_here` → Your actual Client Secret from Step 4

4. Save the `.env` file

---

## Step 6: Test OAuth Flow

### Development Testing

1. **Start your backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start your frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Test the OAuth flow:**
   - Navigate to `http://localhost:3000/login`
   - Click **"Sign in with Google"** button
   - You should be redirected to Google's consent screen
   - Authorize the application
   - You should be redirected back with authentication successful

### Common Issues & Solutions

#### Issue: "Error 400: redirect_uri_mismatch"
**Solution:**
- Check that the redirect URI in Google Console matches exactly with your backend callback URL
- Ensure there are no trailing slashes
- Verify the port number is correct

#### Issue: "Access blocked: This app's request is invalid"
**Solution:**
- Complete the OAuth consent screen configuration
- Add scopes: email, profile, openid
- If in development, add your email as a test user

#### Issue: "Unauthorized client or scope"
**Solution:**
- Enable the Google+ API in your project
- Wait a few minutes for changes to propagate
- Clear browser cache and try again

---

## Step 7: Production Deployment

### Update for Production

1. **Add Production URLs to Google Console:**
   - Go back to **"Credentials"** in Google Cloud Console
   - Edit your OAuth 2.0 Client ID
   - Add production URLs:
     - **Authorized JavaScript origins:**
       ```
       https://yourdomain.com
       ```
     - **Authorized redirect URIs:**
       ```
       https://api.yourdomain.com/api/auth/google/callback
       ```
   - Click **"Save"**

2. **Update Production Environment Variables:**
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Publish OAuth App (if needed):**
   - If your app serves external users, publish the OAuth app
   - Go to **"OAuth consent screen"**
   - Click **"Publish App"**
   - Follow the verification process (may require Google review)

---

## Security Best Practices

1. **Never commit credentials:**
   - Keep `.env` files in `.gitignore`
   - Never commit `GOOGLE_CLIENT_SECRET` to version control

2. **Rotate secrets regularly:**
   - Periodically regenerate client secrets
   - Update environment variables accordingly

3. **Restrict redirect URIs:**
   - Only add trusted domain URLs
   - Remove localhost URLs in production

4. **Monitor usage:**
   - Check Google Cloud Console for API usage
   - Set up quota limits
   - Monitor for suspicious activity

5. **Use HTTPS in production:**
   - Always use HTTPS for OAuth redirects
   - Obtain SSL certificate for your domain

---

## Troubleshooting

### Check Your Configuration

Run this checklist if OAuth isn't working:

- [ ] Google+ API is enabled
- [ ] OAuth consent screen is configured
- [ ] Client ID and Secret are correct in `.env`
- [ ] Redirect URIs match exactly (including http/https, port, path)
- [ ] Frontend URL is correct
- [ ] Backend server is running on the specified port
- [ ] No firewall blocking the callback
- [ ] Browser allows cookies and redirects

### Testing Endpoints

Test if your backend OAuth endpoints are accessible:

```bash
# Should return a redirect to Google
curl http://localhost:4000/api/auth/google
```

### View Logs

Check backend logs for OAuth errors:

```bash
cd backend
npm run dev
# Watch console output when testing Google sign-in
```

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review backend console logs
3. Verify all environment variables are set correctly
4. Ensure Google Cloud project is properly configured

---

**Last Updated:** January 2026
