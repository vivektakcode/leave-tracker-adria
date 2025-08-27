-- Add manager information columns to leave_requests table
-- This will store the manager name and department for each leave request

-- Add manager_name column
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS manager_name TEXT;

-- Add manager_department column  
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS manager_department TEXT;

-- Create index for better performance on manager lookups
CREATE INDEX IF NOT EXISTS idx_leave_requests_manager_name ON leave_requests(manager_name);

-- Update existing leave requests to include manager information
-- This will populate manager info for existing requests based on user relationships
UPDATE leave_requests 
SET 
  manager_name = (
    SELECT u2.name 
    FROM users u1 
    JOIN users u2 ON u1.manager_id = u2.id 
    WHERE u1.id = leave_requests.user_id
  ),
  manager_department = (
    SELECT u2.department 
    FROM users u1 
    JOIN users u2 ON u1.manager_id = u2.id 
    WHERE u1.id = leave_requests.user_id
  )
WHERE status = 'pending' 
  AND manager_name IS NULL 
  AND EXISTS (
    SELECT 1 FROM users u1 
    WHERE u1.id = leave_requests.user_id 
    AND u1.manager_id IS NOT NULL
  );

-- Verify the changes
SELECT 
  lr.id,
  lr.user_id,
  lr.status,
  lr.manager_name,
  lr.manager_department,
  u.name as employee_name,
  u.manager_id
FROM leave_requests lr
JOIN users u ON lr.user_id = u.id
WHERE lr.status = 'pending'
LIMIT 10; 