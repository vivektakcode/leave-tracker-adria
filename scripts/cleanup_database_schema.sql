-- Comprehensive Database Cleanup and Schema Fix
-- This script will clean up unnecessary columns and fix data inconsistencies

-- ===========================================
-- 1. CLEAN UP LEAVE_REQUESTS TABLE
-- ===========================================

-- Remove unnecessary columns that are duplicates or not needed
ALTER TABLE leave_requests DROP COLUMN IF EXISTS user_email;
ALTER TABLE leave_requests DROP COLUMN IF EXISTS email;
ALTER TABLE leave_requests DROP COLUMN IF EXISTS department;
ALTER TABLE leave_requests DROP COLUMN IF EXISTS role;

-- Keep only essential columns: id, user_id, leave_type, start_date, end_date, reason, status, 
-- requested_at, processed_at, processed_by, comments, is_half_day, username, manager_name, manager_department

-- ===========================================
-- 2. CLEAN UP LEAVE_BALANCES TABLE
-- ===========================================

-- Remove unnecessary columns that are duplicates
ALTER TABLE leave_balances DROP COLUMN IF EXISTS user_name;
ALTER TABLE leave_balances DROP COLUMN IF EXISTS user_email;
ALTER TABLE leave_balances DROP COLUMN IF EXISTS username;
ALTER TABLE leave_balances DROP COLUMN IF EXISTS email;
ALTER TABLE leave_balances DROP COLUMN IF EXISTS department;
ALTER TABLE leave_balances DROP COLUMN IF EXISTS role;

-- Keep only essential columns: id, user_id, casual_leave, sick_leave, privilege_leave, created_at, updated_at

-- ===========================================
-- 3. FIX MANAGER RELATIONSHIPS
-- ===========================================

-- Update employees to have proper manager relationships
-- Based on your data, let's assign managers logically

-- Assign demouser to demoadmin (Marketing manager)
UPDATE users 
SET manager_id = 'bf2227b8-479e-4703-90a5-1a9f4cf06249' 
WHERE id = '1145db5e-4cdc-460d-ab9d-76ca14318a18' 
  AND role = 'employee';

-- Assign demo to Mahesh (Management manager) - already done
-- Assign employee1 to John Manager (Management manager)
UPDATE users 
SET manager_id = '128cfd75-c08c-4c67-9615-d5478cb91cf9' 
WHERE id = '7364b629-eaab-4cae-aed2-a13223290aeb' 
  AND role = 'employee';

-- ===========================================
-- 4. POPULATE MANAGER INFORMATION IN LEAVE_REQUESTS
-- ===========================================

-- Update existing leave requests with manager information
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

-- For managers who don't have managers, set their own info (for self-approval cases)
UPDATE leave_requests 
SET 
  manager_name = (
    SELECT name FROM users WHERE id = leave_requests.user_id
  ),
  manager_department = (
    SELECT department FROM users WHERE id = leave_requests.user_id
  )
WHERE status = 'pending' 
  AND manager_name IS NULL 
  AND EXISTS (
    SELECT 1 FROM users u1 
    WHERE u1.id = leave_requests.user_id 
    AND u1.role = 'manager'
  );

-- ===========================================
-- 5. ADD CONSTRAINTS TO PREVENT DUPLICATES
-- ===========================================

-- Create unique constraint to prevent duplicate leave requests for same user on same dates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_dates 
ON leave_requests (user_id, start_date, end_date, status) 
WHERE status IN ('pending', 'approved');

-- ===========================================
-- 6. VERIFY THE CLEANUP
-- ===========================================

-- Check users table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check leave_requests table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leave_requests' 
ORDER BY ordinal_position;

-- Check leave_balances table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leave_balances' 
ORDER BY ordinal_position;

-- Verify manager relationships
SELECT 
  u1.name as employee_name,
  u1.department as employee_dept,
  u1.role as employee_role,
  u2.name as manager_name,
  u2.department as manager_dept
FROM users u1
LEFT JOIN users u2 ON u1.manager_id = u2.id
WHERE u1.role = 'employee'
ORDER BY u1.department, u1.name;

-- Check pending leave requests with manager info
SELECT 
  lr.id,
  lr.username,
  lr.leave_type,
  lr.start_date,
  lr.end_date,
  lr.status,
  lr.manager_name,
  lr.manager_department
FROM leave_requests lr
WHERE lr.status = 'pending'
ORDER BY lr.requested_at DESC; 