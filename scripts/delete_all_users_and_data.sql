-- Script to delete all users and their related data
-- This script handles foreign key constraints by deleting in the correct order

BEGIN;

-- First, let's see what we're about to delete
SELECT 'Users to be deleted:' as info;
SELECT id, username, name, email, role FROM users WHERE country = 'India';

-- Delete from tables that reference users (in order of dependency)

-- 1. Delete password reset tokens (if any)
DELETE FROM password_reset_tokens 
WHERE user_id IN (
    SELECT id FROM users WHERE country = 'India'
);

-- 2. Delete leave requests (these reference users)
DELETE FROM leave_requests 
WHERE user_id IN (
    SELECT id FROM users WHERE country = 'India'
);

-- 3. Delete leave balances (these reference users)
DELETE FROM leave_balances 
WHERE user_id IN (
    SELECT id FROM users WHERE country = 'India'
);

-- 4. Update users table to remove manager references
-- Set manager_id to NULL for users who have managers that will be deleted
UPDATE users 
SET manager_id = NULL 
WHERE manager_id IN (
    SELECT id FROM users WHERE country = 'India'
);

-- 5. Finally, delete the users themselves
DELETE FROM users 
WHERE country = 'India';

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
