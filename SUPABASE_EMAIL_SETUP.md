# Supabase Email Configuration for Magic Links

## Step 1: Configure Supabase SMTP Settings

1. Go to your Supabase dashboard: https://supabase.com/dashboard/projects
2. Select your project: `mqtchcaavsucsdjskptc`
3. Navigate to **Authentication** → **Settings**
4. Scroll down to **SMTP Settings**
5. Configure with Resend:

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP Username: resend
SMTP Password: re_CRNqMK7u_HrEZRYUoKXcpuXvGABdPiYwg (your Resend API key)
SMTP Sender Email: noreply@yourdomain.com (replace with your verified domain)
```

## Step 2: Configure Email Templates

1. In the same **Authentication** → **Settings** page
2. Go to **Email Templates**
3. Update the **Magic Link** template
4. Make sure the **Confirm signup** template is enabled

## Step 3: Site URL Configuration

1. In **Authentication** → **Settings**
2. Set **Site URL** to: `http://localhost:3001` (for development)
3. Add **Redirect URLs**: 
   - `http://localhost:3001/api/auth/callback`
   - `http://localhost:3001/dashboard`

## Step 4: Test Configuration

After configuring, test the magic link:
1. Go to http://localhost:3001/signin
2. Enter your email
3. Click "Send Magic Link"
4. Check your email inbox (and spam folder)

## Common Issues:

1. **No emails received**: Check spam folder, verify SMTP settings
2. **Invalid signature**: Ensure all Supabase keys are from the same project
3. **Redirect errors**: Check Site URL and Redirect URLs configuration