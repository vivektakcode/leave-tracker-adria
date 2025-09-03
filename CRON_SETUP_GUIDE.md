# Cron Job Setup Guide for Leave Tracker

## Overview
The Leave Tracker application uses automated cron jobs to:
1. **Auto-approve past-dated leave requests** (casual leave, privilege leave, sick leave)
2. **Send email reminders** to managers for pending requests every 3 days
3. **Track reminder frequency** to avoid spam

## Environment Variables Setup

### 1. CRON_SECRET (Required for Security)
Add this to your Vercel environment variables:

```bash
CRON_SECRET=your-secure-random-string-here
```

**Generate a secure secret:**
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

**Example:**
```
CRON_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

## Cron Job Configuration

### Option 1: Vercel Cron Jobs (Recommended)
Add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/leave-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0 9 * * *` = Daily at 9:00 AM UTC
- `0 */6 * * *` = Every 6 hours
- `0 9 * * 1-5` = Weekdays only at 9:00 AM UTC

### Option 2: External Cron Service
Use services like:
- **Cron-job.org** (Free)
- **EasyCron** (Paid)
- **SetCronJob** (Free tier available)

**Setup:**
1. Create account on cron service
2. Add new cron job with URL: `https://your-app.vercel.app/api/cron/leave-reminders`
3. Set schedule: Daily at 9:00 AM
4. Add header: `Authorization: Bearer your-cron-secret`

## Database Setup

Run this SQL script in your Supabase database:

```sql
-- Add reminder tracking fields
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE;

ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_leave_requests_reminder_tracking 
ON leave_requests(status, last_reminder_sent, reminder_count) 
WHERE status = 'pending';
```

## How It Works

### 1. Auto-Approval Logic
- **Only approves past-dated requests** (start_date < today)
- **Applies to all leave types**: casual, privilege, sick
- **Future dates require manager approval**

### 2. Reminder System
- **First reminder**: Sent 3 days after request submission
- **Subsequent reminders**: Every 3 days until approved/rejected
- **Tracks reminder count** to avoid spam
- **Stops when request is processed**

### 3. Email Notifications
- **Leave request emails**: Sent immediately when employee submits
- **Reminder emails**: Sent every 3 days for pending requests
- **Professional templates** with all relevant details

## Testing

### Test the Cron Job Endpoint
```bash
# Test with GET (no auth required)
curl https://your-app.vercel.app/api/cron/leave-reminders

# Test with POST (requires CRON_SECRET)
curl -X POST https://your-app.vercel.app/api/cron/leave-reminders \
  -H "Authorization: Bearer your-cron-secret"
```

### Expected Response
```json
{
  "success": true,
  "message": "Leave reminder cron job completed successfully",
  "timestamp": "2025-01-03T09:00:00.000Z"
}
```

## Monitoring

### Check Cron Job Logs
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Functions" tab
4. Click on the cron job function
5. View logs for execution history

### Database Monitoring
```sql
-- Check pending requests needing reminders
SELECT 
  id,
  start_date,
  end_date,
  leave_type,
  requested_at,
  last_reminder_sent,
  reminder_count,
  status
FROM leave_requests 
WHERE status = 'pending' 
  AND requested_at < NOW() - INTERVAL '3 days'
ORDER BY requested_at;
```

## Troubleshooting

### Common Issues

1. **Cron job not running**
   - Check Vercel cron configuration
   - Verify CRON_SECRET is set
   - Check function logs for errors

2. **Emails not sending**
   - Verify RESEND_API_KEY is set
   - Check email service logs
   - Test email configuration

3. **Auto-approval not working**
   - Check database permissions
   - Verify date comparison logic
   - Check function logs

### Debug Mode
Add this to your environment variables for detailed logging:
```
DEBUG_CRON=true
```

## Security Notes

- **CRON_SECRET is required** for production
- **Never commit secrets** to version control
- **Use HTTPS** for all cron job URLs
- **Monitor access logs** for unauthorized attempts

## Cost Considerations

- **Vercel Cron Jobs**: Free tier includes 2 cron jobs
- **Email sending**: Depends on your Resend plan
- **Database queries**: Minimal impact on Supabase usage

## Best Practices

1. **Run during business hours** (9 AM UTC recommended)
2. **Monitor execution logs** regularly
3. **Test in staging** before production
4. **Keep CRON_SECRET secure** and rotate periodically
5. **Set up alerts** for failed executions
