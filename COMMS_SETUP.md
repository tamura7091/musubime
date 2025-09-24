# Comms Function Setup Guide

## Overview
The Comms function allows the admin team to reach out to selected influencers with dynamically generated, customized emails based on their platform, outreach type, and previous contact history.

## Features
- ✅ Fetches selected influencers from Google Sheets "selected" tab
- ✅ Dynamic message generation based on platform (YouTube, Twitter, Shorts, Podcasts, etc.)
- ✅ Customizable team member name tracking
- ✅ Message preview before sending
- ✅ Bulk email sending capability
- ✅ Email sent from partnerships_jp@usespeak.com
- ✅ Integrated into admin dashboard

## How to Use

### 1. Access the Comms Function
1. Log into the admin dashboard
2. Click the "Comms" tab in the navigation

### 2. Set Up Your Outreach
1. **Enter Your Name**: Add your name in the "送信者名" field - this will be used in email signatures
2. **Optional Custom Message**: If you want to override the default template, add your custom message
3. **Select Influencers**: 
   - Use the search bar to find specific influencers
   - Check the boxes next to influencers you want to contact
   - Use "全選択" to select all filtered results

### 3. Generate Preview
1. Click "プレビュー生成" to generate customized messages
2. Review each message - they will be automatically customized based on:
   - Influencer name
   - Platform type (YouTube, Twitter, Shorts, Podcasts, etc.)
   - Outreach type (1st time outreach, PR prep, 2nd outreach)
   - Previous contact history
   - Your team member name

### 4. Send Emails
1. Review all message previews
2. Click "送信" to send all emails
3. Emails will be sent from `partnerships_jp@usespeak.com`
4. You'll get confirmation of successful sends

## Message Templates

The system automatically generates different message templates based on:

### Platform Types
- **YouTube (yt)**: Standard YouTube collaboration template
- **YouTube Shorts (yts)**: Short-form video template
- **Twitter (tw)**: Twitter/X specific template with post format requirements
- **Short Videos (sv)**: Generic short-form video template
- **Podcasts (pc)**: Podcast-specific template
- **Others**: Default template

### Outreach Types
- **1st time outreach**: Initial contact templates
- **PR prep**: Preparation and form submission templates
- **2nd Outreach**: Follow-up templates

### Personalization
- Uses influencer's actual name throughout
- Adjusts greeting based on previous contact history
- Includes team member name in signature
- Platform-specific content requirements

## Google Sheets Integration

The system reads from the "selected" tab with these columns:
- `id_influencer` (B): Unique influencer identifier
- `name` (C): Influencer name
- `contact_email` (K): Email address
- `platform` (M): Platform type (yt, yts, tw, sv, pc, etc.)
- `sender` (Z): Team member/sender name
- `template` (Y): Template/outreach type
- `had_response`: Previous contact indicator

## Email Service Setup

Currently using a simulated email service. To enable actual email sending:

### Option 1: SendGrid
```javascript
// In lib/email-service.ts
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

### Option 2: AWS SES
```javascript
// In lib/email-service.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
```

### Option 3: Nodemailer
```javascript
// In lib/email-service.ts
import nodemailer from 'nodemailer';
```

Add the appropriate environment variables to your `.env.local`:
```
SENDGRID_API_KEY=your_sendgrid_key
# OR
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
# OR
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

## File Structure

```
app/
├── api/comms/route.ts          # API endpoints for fetching influencers and sending emails
├── dashboard/admin/page.tsx    # Admin dashboard with Comms tab
components/
├── CommsPanel.tsx              # Main Comms UI component
lib/
├── email-service.ts            # Email sending service
├── google-sheets.ts            # Google Sheets integration
```

## Security Notes

- All email sending is logged for tracking
- Only admin users can access the Comms function
- Email addresses are validated before sending
- Rate limiting is implemented to prevent spam

## Future Enhancements

- Email delivery tracking
- Response tracking integration
- Template management UI
- Scheduled email sending
- Email analytics dashboard
- Integration with CRM systems

## Troubleshooting

### Common Issues

1. **No influencers showing**: Check Google Sheets permissions and column headers
2. **Email sending fails**: Verify email service configuration and API keys
3. **Templates not generating**: Check platform mapping and outreach type values
4. **Permission errors**: Ensure user has admin role

### Debug Mode

Enable debug logging by checking browser console for detailed information about:
- Data fetching from Google Sheets
- Message generation process
- Email sending results

