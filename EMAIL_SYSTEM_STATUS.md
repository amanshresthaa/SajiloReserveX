# Email System Configuration and Fixes

## Overview
The SajiloReserveX application uses **Resend** for sending emails, replacing the previous Mailgun configuration. The email system is working correctly for booking confirmations and test emails.

## Current Setup

### Email Provider: Resend
- **Service**: Resend API
- **Configuration**: `/libs/resend.ts`
- **Environment Variables**:
  - `RESEND_API_KEY`: API key for Resend service
  - `RESEND_FROM`: From email address (e.g., "SajiloReserveX <noreply@example.com>")

### Email Types Supported
1. **Booking Confirmation Emails** - Sent automatically when bookings are created
2. **Test Emails** - Available via `/api/test-email` endpoint
3. **Support Email Forwarding** - Via webhook for customer replies

## Recent Fixes Applied

### 1. Fixed Mailgun Webhook
**Issue**: The webhook at `/api/webhook/mailgun/route.ts` was trying to use Mailgun for forwarding emails, but only had a placeholder API key.

**Fix**: Updated the webhook to use Resend instead of Mailgun for email forwarding.

**File Changed**: `app/api/webhook/mailgun/route.ts`
```typescript
// Changed from:
import { sendEmail } from "@/libs/mailgun";

// To:
import { sendEmail } from "@/libs/resend";
```

### 2. Updated Environment Configuration
**Issue**: Placeholder Mailgun API key was causing potential confusion.

**Fix**: Commented out the placeholder Mailgun API key in `.env.local`.

### 3. Updated App Configuration
**Issue**: Config still referenced ShipFast branding and incorrect email addresses.

**Fix**: Updated `config.ts` to use SajiloReserveX branding and example.com email addresses.

## Email System Status

### ✅ Working Components
- Booking confirmation emails (tested successfully)
- Simple test emails via API
- Resend integration
- Email sending functionality

### ⚠️ Configuration Notes
- Support emails in config use `@example.com` - update these to your actual domain
- Mailgun webhook forwarding now uses Resend (maintains functionality)
- Test email endpoint available at `/api/test-email` with proper authentication

## Testing the Email System

### 1. Test Simple Email
```bash
curl -X POST "http://localhost:3000/api/test-email" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer local-dev-token" \
  -d '{"type": "simple", "email": "test@example.com"}'
```

### 2. Test Booking Email
```bash
curl -X POST "http://localhost:3000/api/test-email" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer local-dev-token" \
  -d '{"type": "booking", "email": "test@example.com"}'
```

### 3. Test Real Booking (includes email)
```bash
curl -X POST "http://localhost:3000/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-09-25",
    "time": "19:00",
    "party": 2,
    "bookingType": "dinner",
    "seating": "any",
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "+1234567890"
  }'
```

## Next Steps for Production

1. **Update Email Addresses**: Replace `@example.com` addresses in `config.ts` with your actual domain
2. **Domain Verification**: Ensure your domain is verified with Resend
3. **DNS Configuration**: Set up SPF/DKIM records for your domain in Resend
4. **Support Email Setup**: Update support email configuration to match your customer service setup

## Environment Variables Required

```bash
# Required for email functionality
RESEND_API_KEY=re_your_actual_key_here
RESEND_FROM="YourApp <noreply@yourdomain.com>"

# Optional for test endpoint
TEST_EMAIL_ACCESS_TOKEN=your_secure_token
TEST_EMAIL_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## Troubleshooting

### Common Issues
1. **"Resend is not configured"** - Check `RESEND_API_KEY` and `RESEND_FROM` env vars
2. **401 Unauthorized on test endpoint** - Check `TEST_EMAIL_ACCESS_TOKEN`
3. **Emails not delivered** - Verify domain setup in Resend dashboard

### Logs to Check
- Browser console for frontend errors
- Server logs for email sending attempts
- Resend dashboard for delivery status