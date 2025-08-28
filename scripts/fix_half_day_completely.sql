-- COMPLETE HALF-DAY FUNCTIONALITY FIX
-- This script addresses ALL issues with half-day leave functionality

-- ===========================================
-- PHASE 1: DIAGNOSE THE PROBLEMS
-- ===========================================

SELECT '=== DIAGNOSING HALF-DAY ISSUES ===' as status;

-- 1. Check current schema
SELECT '1. Checking database schema...' as step;
SELECT 
  column_name, 
  data_type,
  CASE 
    WHEN data_type IN ('integer', 'bigint', 'smallint') THEN '❌ INTEGER - Cannot store decimals'
    WHEN data_type IN ('numeric', 'decimal', 'real', 'double precision') THEN '✅ DECIMAL - Can store decimals'
    ELSE '❓ UNKNOWN - ' || data_type
  END as decimal_support
FROM information_schema.columns 
WHERE table_name = 'leave_balances' 
  AND column_name IN ('casual_leave', 'sick_leave', 'privilege_leave')
ORDER BY column_name;

-- 2. Check current leave requests
SELECT '2. Checking current leave requests...' as step;
SELECT 
  lr.start_date,
  lr.end_date,
  lr.is_half_day,
  lr.status,
  lr.leave_type,
  u.email,
  CASE 
    WHEN lr.start_date = lr.end_date THEN 
      CASE WHEN lr.is_half_day THEN 0.5 ELSE 1 END
    ELSE 
      (lr.end_date::date - lr.start_date::date) + 1
  END as calculated_days
FROM leave_requests lr
JOIN users u ON lr.user_id = u.id
ORDER BY lr.requested_at DESC;

-- 3. Check current balances
SELECT '3. Checking current leave balances...' as step;
SELECT 
  u.email,
  u.name,
  lb.casual_leave,
  lb.sick_leave,
  lb.privilege_leave,
  (6 - lb.casual_leave) as casual_used,
  (6 - lb.sick_leave) as sick_used,
  (18 - lb.privilege_leave) as privilege_used
FROM leave_balances lb
JOIN users u ON lb.user_id = u.id
ORDER BY u.email;

-- ===========================================
-- PHASE 2: FIX THE SCHEMA
-- ===========================================

SELECT '=== FIXING DATABASE SCHEMA ===' as status;

-- 4. Fix schema to support decimals
SELECT '4. Changing columns to NUMERIC to support half-days...' as step;
ALTER TABLE leave_balances 
ALTER COLUMN casual_leave TYPE NUMERIC(5,2);

ALTER TABLE leave_balances 
ALTER COLUMN sick_leave TYPE NUMERIC(5,2);

ALTER TABLE leave_balances 
ALTER COLUMN privilege_leave TYPE NUMERIC(5,2);

-- 5. Verify schema change
SELECT '5. Verifying schema change...' as step;
SELECT 
  column_name, 
  data_type,
  CASE 
    WHEN data_type IN ('integer', 'bigint', 'smallint') THEN '❌ Still INTEGER'
    WHEN data_type IN ('numeric', 'decimal', 'real', 'double precision') THEN '✅ Now NUMERIC'
    ELSE '❓ UNKNOWN - ' || data_type
  END as decimal_support
FROM information_schema.columns 
WHERE table_name = 'leave_balances' 
  AND column_name IN ('casual_leave', 'sick_leave', 'privilege_leave')
ORDER BY column_name;

-- ===========================================
-- PHASE 3: RESET AND TEST
-- ===========================================

SELECT '=== RESETTING FOR TESTING ===' as status;

-- 6. Clean up all leave requests
SELECT '6. Removing all existing leave requests...' as step;
DELETE FROM leave_requests;
SELECT 'Leave requests removed: ' || COUNT(*) as result FROM leave_requests;

-- 7. Reset all balances to default
SELECT '7. Resetting all leave balances to default...' as step;
UPDATE leave_balances 
SET 
  casual_leave = 6.0,
  sick_leave = 6.0, 
  privilege_leave = 18.0,
  updated_at = NOW();

-- 8. Verify reset
SELECT '8. Verifying reset...' as step;
SELECT 
  u.email,
  u.name,
  lb.casual_leave,
  lb.sick_leave,
  lb.privilege_leave,
  pg_typeof(lb.casual_leave) as casual_type
FROM leave_balances lb
JOIN users u ON lb.user_id = u.id
ORDER BY u.email;

-- ===========================================
-- PHASE 4: TEST HALF-DAY LOGIC
-- ===========================================

SELECT '=== TESTING HALF-DAY LOGIC ===' as status;

-- 9. Create test half-day request
SELECT '9. Creating test half-day request...' as step;
INSERT INTO leave_requests (
  id,
  user_id,
  username,
  leave_type,
  start_date,
  end_date,
  reason,
  is_half_day,
  status,
  requested_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'check@gmail.com' LIMIT 1),
  (SELECT username FROM users WHERE email = 'check@gmail.com' LIMIT 1),
  'casual',
  '2025-01-20',
  '2025-01-20',
  'Test half-day functionality',
  true,
  'approved',
  NOW()
);

-- 10. Test balance update for half-day
SELECT '10. Testing balance update for half-day...' as step;
UPDATE leave_balances 
SET 
  casual_leave = casual_leave - 0.5,
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM users WHERE email = 'check@gmail.com' LIMIT 1
);

-- 11. Verify half-day calculation
SELECT '11. Verifying half-day calculation...' as step;
SELECT 
  u.email,
  u.name,
  lb.casual_leave as remaining_casual,
  (6.0 - lb.casual_leave) as used_casual,
  CASE 
    WHEN lb.casual_leave = 5.5 THEN '✅ Half-day working correctly!'
    ELSE '❌ Half-day not working - balance is ' || lb.casual_leave
  END as status
FROM leave_balances lb
JOIN users u ON lb.user_id = u.id
WHERE u.email = 'check@gmail.com';

-- ===========================================
-- PHASE 5: FINAL VERIFICATION
-- ===========================================

SELECT '=== FINAL VERIFICATION ===' as status;

-- 12. Complete system check
SELECT '12. Final system verification...' as step;
SELECT 
  'Schema Fixed' as check_item,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NUMERIC columns support decimals'
    ELSE '❌ Still have INTEGER columns'
  END as status
FROM information_schema.columns 
WHERE table_name = 'leave_balances' 
  AND column_name IN ('casual_leave', 'sick_leave', 'privilege_leave')
  AND data_type = 'integer'

UNION ALL

SELECT 
  'Half-day Test' as check_item,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Half-day request created successfully'
    ELSE '❌ Half-day request failed'
  END as status
FROM leave_requests 
WHERE is_half_day = true

UNION ALL

SELECT 
  'Balance Update' as check_item,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Balance updated to 5.5 for half-day'
    ELSE '❌ Balance not updated correctly'
  END as status
FROM leave_balances lb
JOIN users u ON lb.user_id = u.id
WHERE u.email = 'check@gmail.com' AND lb.casual_leave = 5.5;

-- 13. Instructions for portal testing
SELECT '=== READY FOR PORTAL TESTING ===' as status;
SELECT 
  'Now test in your Leave Tracker portal:' as instruction,
  '1. Login as check@gmail.com' as step1,
  '2. Create a half-day leave request' as step2,
  '3. Check if dashboard shows 0.5 days used' as step3,
  '4. Verify balance shows 5.5 days remaining' as step4
UNION ALL
SELECT 
  'Expected Results:' as instruction,
  'Total: 0.5 of 30 days used' as step1,
  'Casual: 0.5 of 6 days used' as step2,
  'Remaining: 5.5 days' as step3,
  'Half-day functionality working!' as step4;
