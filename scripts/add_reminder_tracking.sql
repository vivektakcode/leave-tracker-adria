-- Add reminder tracking fields to leave_requests table
-- This allows us to track when reminders were last sent and how many times

-- Add last_reminder_sent column to track when the last reminder was sent
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE;

-- Add reminder_count column to track how many reminders have been sent
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Add comment to explain the new columns
COMMENT ON COLUMN leave_requests.last_reminder_sent IS 'Timestamp when the last reminder email was sent to the manager';
COMMENT ON COLUMN leave_requests.reminder_count IS 'Number of reminder emails sent for this request';

-- Create index for efficient querying of requests needing reminders
CREATE INDEX IF NOT EXISTS idx_leave_requests_reminder_tracking 
ON leave_requests(status, last_reminder_sent, reminder_count) 
WHERE status = 'pending';
