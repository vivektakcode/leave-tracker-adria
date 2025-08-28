-- RESET AND PREPARE FOR PORTAL TESTING
-- This script will clean everything and prepare for testing the new half-day logic

-- 1. Show current state
SELECT '=== BEFORE RESET ===' as status;
SELECT 'Total leave requests:' as info, COUNT(*) as count FROM leave_requests;
SELECT 'Total users:' as info, COUNT(*) as count FROM users;

-- 2. Delete ALL leave requests
DELETE FROM leave_requests;
SELECT '=== AFTER CLEANUP ===' as status;
SELECT 'Remaining leave requests:' as info, COUNT(*) as count FROM leave_requests;

-- 3. Reset ALL leave balances to default
UPDATE leave_balances 
SET 
  casual_leave = 6,
  sick_leave = 6, 
  privilege_leave = 18,
  updated_at = NOW();

-- 4. Fix schema to support half-days (change integer to numeric if needed)
-- This allows decimal values like 4.5 for half days
ALTER TABLE leave_balances 
ALTER COLUMN casual_leave TYPE NUMERIC(5,2);

ALTER TABLE leave_balances 
ALTER COLUMN sick_leave TYPE NUMERIC(5,2);

ALTER TABLE leave_balances 
ALTER COLUMN privilege_leave TYPE NUMERIC(5,2);

-- 5. Verify the reset and schema fix
SELECT '=== AFTER RESET AND SCHEMA FIX ===' as status;
SELECT 
  u.email,
  u.name,
  lb.casual_leave,
  lb.sick_leave,
  lb.privilege_leave,
  pg_typeof(lb.casual_leave) as casual_type,
  pg_typeof(lb.sick_leave) as sick_type,
  pg_typeof(lb.privilege_leave) as privilege_type
FROM leave_balances lb
JOIN users u ON lb.user_id = u.id
ORDER BY u.email;

-- 6. Final verification
SELECT '=== READY FOR TESTING ===' as status;
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All leave requests removed'
    ELSE '❌ Still have ' || COUNT(*) || ' leave requests'
  END as leave_requests_status,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All balances reset to default'
    ELSE '❌ Some balances not reset'
  END as balance_status,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Schema supports decimals (NUMERIC)'
    ELSE '❌ Schema still INTEGER'
  END as schema_status
FROM (
  SELECT 1 as check1 FROM leave_requests
  UNION ALL
  SELECT 1 FROM leave_balances WHERE casual_leave != 6 OR sick_leave != 6 OR privilege_leave != 18
  UNION ALL
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'leave_balances' 
    AND column_name IN ('casual_leave', 'sick_leave', 'privilege_leave')
    AND data_type = 'integer'
) checks;

-- 7. Instructions for testing
SELECT '=== TESTING INSTRUCTIONS ===' as status;
SELECT 
  '1. Go to your Leave Tracker portal' as step,
  '2. Login as any user' as action,
  '3. Create a leave request for 1 day' as test1,
  '4. Create another request for 0.5 day (half day)' as test2,
  '5. Check if the dashboard shows correct calculations' as verify
UNION ALL
SELECT 
  'Expected Results:' as step,
  'Total: 1.5 of 30 days used' as action,
  'Casual: 1.5 of 6 days used' as test1,
  'Remaining: 4.5 days' as test2,
  'Half-day logic working!' as verify;
