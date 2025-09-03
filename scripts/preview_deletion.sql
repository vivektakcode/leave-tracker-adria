-- Preview script - shows what will be deleted without actually deleting
-- Run this first to see what data will be affected

-- List of user IDs to delete (from your data)
WITH users_to_delete AS (
    SELECT unnest(ARRAY[
        '1145db5e-4cdc-460d-ab9d-76ca14318a18', -- demouser
        '128cfd75-c08c-4c67-9615-d5478cb91cf9', -- manager1
        '523b9160-25b4-458a-9461-acf81cc040e9', -- VivekTak
        '63200107-c441-43cc-839e-6f3d394b2cb1', -- vivektak
        '66cc982c-d16c-4ef5-9431-2b3c0503ea59', -- dem
        '7364b629-eaab-4cae-aed2-a13223290aeb', -- employee1
        '978f4bcb-ed5c-4a1b-957a-05822c7e728c', -- demo
        'b6fa632f-94f8-45d3-8a99-3a15dfd0bdfb', -- check
        'bf2227b8-479e-4703-90a5-1a9f4cf06249', -- demoadmin
        'd6539121-640f-4ca8-b47a-01b645094ec9', -- megatron
        'fd9a646f-0984-47e0-8c79-94d710a3a5a2'  -- punisher
    ]) AS user_id
)

-- Show users that will be deleted
SELECT '=== USERS TO BE DELETED ===' as section;
SELECT u.id, u.username, u.name, u.email, u.role, u.department
FROM users u 
INNER JOIN users_to_delete utd ON u.id = utd.user_id
ORDER BY u.role, u.username;

-- Show leave requests that will be deleted
SELECT '=== LEAVE REQUESTS TO BE DELETED ===' as section;
SELECT lr.id, lr.user_id, u.username, lr.leave_type, lr.start_date, lr.end_date, lr.status
FROM leave_requests lr
INNER JOIN users u ON lr.user_id = u.id
INNER JOIN users_to_delete utd ON lr.user_id = utd.user_id
ORDER BY lr.created_at DESC;

-- Show leave balances that will be deleted
SELECT '=== LEAVE BALANCES TO BE DELETED ===' as section;
SELECT lb.id, lb.user_id, u.username, lb.casual_leave, lb.sick_leave, lb.privilege_leave
FROM leave_balances lb
INNER JOIN users u ON lb.user_id = u.id
INNER JOIN users_to_delete utd ON lb.user_id = utd.user_id
ORDER BY u.username;

-- Show password reset tokens that will be deleted
SELECT '=== PASSWORD RESET TOKENS TO BE DELETED ===' as section;
SELECT prt.id, prt.user_id, u.username, prt.expires_at
FROM password_reset_tokens prt
INNER JOIN users u ON prt.user_id = u.id
INNER JOIN users_to_delete utd ON prt.user_id = utd.user_id
ORDER BY prt.expires_at DESC;

-- Show users who will have their manager_id set to NULL
SELECT '=== USERS WHO WILL LOSE THEIR MANAGER ===' as section;
SELECT u.id, u.username, u.name, u.manager_id, m.username as manager_username
FROM users u
LEFT JOIN users m ON u.manager_id = m.id
WHERE u.manager_id IN (SELECT user_id FROM users_to_delete)
ORDER BY u.username;

-- Show summary counts
SELECT '=== DELETION SUMMARY ===' as section;
SELECT 
    (SELECT COUNT(*) FROM users u INNER JOIN users_to_delete utd ON u.id = utd.user_id) as users_to_delete,
    (SELECT COUNT(*) FROM leave_requests lr INNER JOIN users_to_delete utd ON lr.user_id = utd.user_id) as leave_requests_to_delete,
    (SELECT COUNT(*) FROM leave_balances lb INNER JOIN users_to_delete utd ON lb.user_id = utd.user_id) as leave_balances_to_delete,
    (SELECT COUNT(*) FROM password_reset_tokens prt INNER JOIN users_to_delete utd ON prt.user_id = utd.user_id) as password_tokens_to_delete,
    (SELECT COUNT(*) FROM users u WHERE u.manager_id IN (SELECT user_id FROM users_to_delete)) as users_losing_manager;
