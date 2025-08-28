# Email Notification System Setup

This document explains how to set up the email notification system for the Leave Tracker application.

## 🚀 Features

- **Automatic Manager Notifications**: When an employee submits a leave request, their manager receives an email notification
- **Clickable Action Button**: The email contains a button that redirects to the admin dashboard for approval/rejection
- **Professional Email Template**: Beautiful, responsive HTML email design
- **Fallback Support**: Multiple email service options for reliability

## 📧 Email Service Options

### Option 1: Resend (Recommended)

[Resend](https://resend.com) is a modern email API that's perfect for Next.js applications.

#### Setup Steps:

1. **Sign up for Resend**
   - Go to [resend.com](https://resend.com)
   - Create a free account (10,000 emails/month free)

2. **Get API Key**
   - Go to API Keys section
   - Create a new API key
   - Copy the API key

3. **Configure Environment**
   ```bash
   # Add to your .env.local file
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   NEXT_PUBLIC_WEBSITE_URL=https://your-domain.vercel.app
   ```

4. **Verify Domain (Optional but Recommended)**
   - Add your domain in Resend dashboard
   - Update the `from` field in `lib/emailService.ts`

### Option 2: Nodemailer (Development/Testing)

For local development or testing, you can use Nodemailer with Gmail or other SMTP providers.

#### Gmail Setup:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Configure Environment**:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

## 🔧 Configuration

### Environment Variables

```bash
# Required for Resend
RESEND_API_KEY=your_resend_api_key

# Required for email links
NEXT_PUBLIC_WEBSITE_URL=https://your-domain.vercel.app

# Optional: Custom from address
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Website URL Configuration

The `NEXT_PUBLIC_WEBSITE_URL` should point to your deployed application:

- **Local Development**: `http://localhost:4444`
- **Vercel**: `https://your-app.vercel.app`
- **Custom Domain**: `https://yourdomain.com`

## 📱 Email Template Features

### Design Elements:
- **Professional Layout**: Clean, modern design with company branding
- **Responsive Design**: Works on all devices and email clients
- **Action Button**: Prominent CTA button for easy access
- **Request Details**: Clear presentation of leave request information
- **Company Branding**: Customizable logo and colors

### Email Content Includes:
- Manager's name and greeting
- Employee details (name, leave type, dates, reason)
- Request ID for tracking
- Direct link to admin dashboard
- Professional styling and formatting

## 🧪 Testing

### Test Email Sending:

1. **Submit a Leave Request** through the application
2. **Check Console Logs** for email status
3. **Verify Email Delivery** in your inbox
4. **Test Clickable Button** to ensure it redirects correctly

### Production Testing:

1. **Deploy to Vercel** with environment variables configured
2. **Submit real leave requests** through the live application
3. **Check email delivery** in manager's inbox
4. **Verify button functionality** redirects to admin dashboard

## 🚨 Troubleshooting

### Common Issues:

1. **"RESEND_API_KEY not configured"**
   - Add `RESEND_API_KEY` to your Vercel environment variables
   - Redeploy your application

2. **"Failed to send manager notification"**
   - Check if user has a manager assigned
   - Verify manager email is valid
   - Check Resend API key and limits

3. **Email not received**
   - Check spam/junk folder
   - Verify sender email configuration
   - Check Resend dashboard for delivery status

4. **Button not working**
   - Verify `NEXT_PUBLIC_WEBSITE_URL` is correct
   - Check if admin dashboard route exists
   - Test URL manually in browser

### Debug Mode:

Enable detailed logging by checking console output:
- ✅ Success messages
- ⚠️ Warning messages  
- ❌ Error messages

## 🔒 Security Considerations

- **API Keys**: Never commit API keys to version control
- **Email Validation**: System validates email addresses before sending
- **Rate Limiting**: Resend provides built-in rate limiting
- **Domain Verification**: Verify your domain in Resend for better deliverability

## 📈 Monitoring

### Resend Dashboard:
- Track email delivery rates
- Monitor bounce rates
- View analytics and performance
- Check API usage and limits

### Application Logs:
- Email send attempts
- Success/failure status
- Manager notification details
- Error tracking and debugging

## 🚀 Production Deployment

### Vercel Deployment:

1. **Add Environment Variables** in Vercel dashboard
2. **Set Website URL** to your production domain
3. **Verify Domain** in Resend (recommended)
4. **Test Email Flow** in production environment

### Environment Variables in Vercel:

```bash
RESEND_API_KEY=re_prod_xxxxxxxxxxxxx
NEXT_PUBLIC_WEBSITE_URL=https://yourdomain.com
```

## 📞 Support

If you encounter issues:

1. **Check Console Logs** for error messages
2. **Verify Environment Variables** are set correctly
3. **Test with Simple Email** first
4. **Check Resend Dashboard** for delivery status
5. **Review Network Tab** for API call failures

## 🔄 Updates and Maintenance

The email system is designed to be:
- **Non-blocking**: Email failures don't affect leave request creation
- **Maintainable**: Easy to update templates and logic
- **Scalable**: Can handle multiple email services
- **Reliable**: Fallback options for different scenarios
