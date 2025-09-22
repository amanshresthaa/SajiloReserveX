# Resend Email Setup Guide

## Issue Found
The email system is configured with placeholder values that won't work for actual email delivery:

- `RESEND_API_KEY=re_i9nUoZm1_9xkYwgXQhgSvcTmYoVzhy21y` (placeholder key)
- `RESEND_FROM="SajiloReserveX <noreply@example.com>"` (invalid domain)

## Steps to Fix Email Delivery

### 1. Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key
1. In the Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name like "SajiloReserveX"
4. Copy the API key (starts with `re_`)

### 3. Set Up Domain (Option A: Use Resend's Domain)
For testing, you can use Resend's onboarding domain:
```bash
RESEND_FROM="SajiloReserveX <onboarding@resend.dev>"
```

### 4. Set Up Your Own Domain (Option B: Recommended for Production)
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides to your domain
5. Wait for verification
6. Use your domain:
```bash
RESEND_FROM="SajiloReserveX <noreply@yourdomain.com>"
```

### 5. Update Environment Variables
Update your `.env.local` file:

```bash
# Replace with your actual Resend API key
RESEND_API_KEY=re_your_actual_api_key_here

# Use either Resend's domain or your verified domain
RESEND_FROM="SajiloReserveX <onboarding@resend.dev>"
# OR for your own domain:
# RESEND_FROM="SajiloReserveX <noreply@yourdomain.com>"
```

### 6. Test the Setup
After updating the environment variables:

1. Restart the dev server:
```bash
npm run dev
```

2. Test with your email:
```bash
curl -X POST "http://localhost:3000/api/test-email" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer local-dev-token" \
  -d '{"type": "simple", "email": "amanshresthaaaaa@gmail.com"}'
```

## Quick Test with Resend's Domain

If you want to test immediately, you can use Resend's testing domain. Update your `.env.local`:

```bash
# Keep your actual API key here
RESEND_API_KEY=re_your_actual_api_key_here

# Use Resend's testing domain temporarily
RESEND_FROM="SajiloReserveX <onboarding@resend.dev>"
```

## Common Issues

### "Domain not verified"
- Make sure you've added the DNS records Resend provided
- Wait up to 48 hours for DNS propagation
- Use Resend's onboarding domain for testing

### "Invalid API key"
- Make sure you copied the full API key from Resend
- API keys start with `re_`
- Don't include extra spaces or quotes

### Still not receiving emails?
- Check your spam/junk folder
- Verify the email address is correct
- Check Resend dashboard logs for delivery status

## Current Configuration Status
❌ **RESEND_API_KEY**: Using placeholder key
❌ **RESEND_FROM**: Using invalid @example.com domain

## Next Steps
1. Get real Resend API key
2. Update RESEND_FROM to use resend.dev or your verified domain
3. Test email delivery
4. Set up your own domain for production use