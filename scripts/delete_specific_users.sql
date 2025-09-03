-- Script to delete specific users and their related data
-- This script deletes only the users you specified by their IDs

BEGIN;

-- First, let's see what we're about to delete
SELECT 'Users to be deleted:' as info;
SELECT u.id, u.username, u.name, u.email, u.role 
FROM users u 
WHERE u.id IN (
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
);

-- Delete from tables that reference users (in order of dependency)

-- 1. Delete password reset tokens (if any)
DELETE FROM password_reset_tokens 
WHERE user_id IN (
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
);

-- 2. Delete leave requests (these reference users)
DELETE FROM leave_requests 
WHERE user_id IN (
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
);

-- 3. Delete leave balances (these reference users)
DELETE FROM leave_balances 
WHERE user_id IN (
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
);

-- 4. Update users table to remove manager references
-- Set manager_id to NULL for users who have managers that will be deleted
UPDATE users 
SET manager_id = NULL 
WHERE manager_id IN (
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
);

-- 5. Finally, delete the users themselves
DELETE FROM users 
WHERE id IN (
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
);

-- Show summary of what was deleted
SELECT 'Deletion completed. Summary:' as info;

-- Count remaining users
SELECT COUNT(*) as remaining_users FROM users;

-- Count remaining leave requests
SELECT COUNT(*) as remaining_leave_requests FROM leave_requests;

-- Count remaining leave balances
SELECT COUNT(*) as remaining_leave_balances FROM leave_balances;

-- Count remaining password reset tokens
SELECT COUNT(*) as remaining_password_tokens FROM password_reset_tokens;

COMMIT;

-- If you want to rollback instead of commit, use:
-- ROLLBACK;
