-- Test Script to Verify All Functionality Works Correctly
-- Run this after executing the cleanup script

-- ===========================================
-- 1. VERIFY TABLE STRUCTURES
-- ===========================================

-- Check users table
SELECT 'USERS TABLE STRUCTURE:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check leave_requests table
SELECT 'LEAVE_REQUESTS TABLE STRUCTURE:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'leave_requests' 
ORDER BY ordinal_position;

-- Check leave_balances table
SELECT 'LEAVE_BALANCES TABLE STRUCTURE:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'leave_balances' 
ORDER BY ordinal_position;

-- ===========================================
-- 2. VERIFY MANAGER RELATIONSHIPS
-- ===========================================

SELECT 'MANAGER-EMPLOYEE RELATIONSHIPS:' as info;
SELECT 
  u1.name as employee_name,
  u1.department as employee_dept,
  u1.role as employee_role,
  u2.name as manager_name,
  u2.department as manager_dept,
  CASE 
    WHEN u1.manager_id IS NOT NULL THEN '✅ Assigned'
    ELSE '❌ No Manager'
  END as status
FROM users u1
LEFT JOIN users u2 ON u1.manager_id = u2.id
WHERE u1.role = 'employee'
ORDER BY u1.department, u1.name;

-- ===========================================
-- 3. VERIFY LEAVE REQUESTS WITH MANAGER INFO
-- ===========================================

SELECT 'PENDING LEAVE REQUESTS WITH MANAGER INFO:' as info;
SELECT 
  lr.username,
  lr.leave_type,
  lr.start_date,
  lr.end_date,
  lr.reason,
  lr.status,
  lr.manager_name,
  lr.manager_department,
  CASE 
    WHEN lr.manager_name IS NOT NULL THEN '✅ Manager Info Present'
    ELSE '❌ Missing Manager Info'
  END as manager_status
FROM leave_requests lr
WHERE lr.status = 'pending'
ORDER BY lr.requested_at DESC;

-- ===========================================
-- 4. VERIFY LEAVE BALANCES
-- ===========================================

SELECT 'LEAVE BALANCES:' as info;
SELECT 
  u.name,
  u.department,
  u.role,
  lb.casual_leave,
  lb.sick_leave,
  lb.privilege_leave,
  (lb.casual_leave + lb.sick_leave + lb.privilege_leave) as total_remaining
FROM leave_balances lb
JOIN users u ON lb.user_id = u.id
ORDER BY u.role DESC, u.department, u.name;

-- ===========================================
-- 5. TEST DUPLICATE PREVENTION
-- ===========================================

SELECT 'DUPLICATE PREVENTION INDEXES:' as info;
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'leave_requests' 
  AND indexname LIKE '%unique%';

-- ===========================================
-- 6. VERIFY DATA CONSISTENCY
-- ===========================================

SELECT 'DATA CONSISTENCY CHECK:' as info;

-- Check if all users have leave balances
SELECT 
  'Users without leave balances:' as check_type,
  COUNT(*) as count
FROM users u
LEFT JOIN leave_balances lb ON u.id = lb.user_id
WHERE lb.user_id IS NULL

UNION ALL

-- Check if all leave requests have usernames
SELECT 
  'Leave requests without usernames:' as check_type,
  COUNT(*) as count
FROM leave_requests lr
WHERE lr.username IS NULL OR lr.username = ''

UNION ALL

-- Check if all pending requests have manager info
SELECT 
  'Pending requests without manager info:' as check_type,
  COUNT(*) as count
FROM leave_requests lr
WHERE lr.status = 'pending' 
  AND (lr.manager_name IS NULL OR lr.manager_name = '');

-- ===========================================
-- 7. SAMPLE DATA FOR TESTING
-- ===========================================

SELECT 'SAMPLE DATA FOR TESTING:' as info;

-- Sample user for testing
SELECT 
  'Test User Data:' as data_type,
  u.name,
  u.username,
  u.role,
  u.department,
  u.manager_id,
  m.name as manager_name
FROM users u
LEFT JOIN users m ON u.manager_id = m.id
WHERE u.username IN ('demouser', 'demo', 'employee1')
LIMIT 3;

-- Sample leave request for testing
SELECT 
  'Test Leave Request:' as data_type,
  lr.username,
  lr.leave_type,
  lr.start_date,
  lr.end_date,
  lr.status,
  lr.manager_name,
  lr.manager_department
FROM leave_requests lr
WHERE lr.status = 'pending'
LIMIT 2; 