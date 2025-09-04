-- Cleanup script for leave_requests table
-- Remove unnecessary fields that can be derived from other tables

-- Remove redundant fields that can be derived from user_id
ALTER TABLE leave_requests DROP COLUMN IF EXISTS username;
ALTER TABLE leave_requests DROP COLUMN IF EXISTS manager_name;
ALTER TABLE leave_requests DROP COLUMN IF EXISTS manager_department;

-- Remove unused auto-approval fields (not implemented in the application)
ALTER TABLE leave_requests DROP COLUMN IF EXISTS auto_approved;
ALTER TABLE leave_requests DROP COLUMN IF EXISTS auto_approval_reason;

-- Add comment explaining the cleanup
COMMENT ON TABLE leave_requests IS 'Leave requests table - optimized by removing redundant fields that can be derived from users table';

-- Create a view for backward compatibility that includes derived fields
CREATE OR REPLACE VIEW leave_requests_with_details AS
SELECT 
    lr.*,
    u.name as username,
    m.name as manager_name,
    m.department as manager_department
FROM leave_requests lr
LEFT JOIN users u ON lr.user_id = u.id
LEFT JOIN users m ON u.manager_id = m.id;

-- Add comment to the view
COMMENT ON VIEW leave_requests_with_details IS 'View that includes derived fields for backward compatibility';
