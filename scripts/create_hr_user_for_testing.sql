-- SQL Script to Create HR User for Testing All Functionalities
-- This script creates a comprehensive HR user with sample data for testing

-- 0. First, update the role constraint to allow the new roles
DO $$
BEGIN
    -- Drop the existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
    
    -- Add the new constraint with all required roles
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'user', 'hr', 'manager', 'employee'));
    
    RAISE NOTICE 'Updated role constraint to allow: admin, user, hr, manager, employee';
END $$;

-- 1. Create HR User
INSERT INTO users (
    id,
    username,
    password,
    name,
    email,
    role,
    department,
    country,
    manager_id,
    email_verified,
    created_at
) VALUES (
    gen_random_uuid(),
    'hr_test',
    'hr1234',
    'HR Test User',
    'hr.test@company.com',
    'hr',
    'Human Resources',
    'Morocco',
    NULL, -- HR users don't have managers
    TRUE, -- Email verified
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- 2. Get the HR user ID for further operations
DO $$
DECLARE
    hr_user_id UUID;
BEGIN
    -- Get the HR user ID
    SELECT id INTO hr_user_id FROM users WHERE username = 'hr_test';
    
    IF hr_user_id IS NOT NULL THEN
        -- 3. Create leave balance for HR user (check if exists first)
        IF NOT EXISTS (SELECT 1 FROM leave_balances WHERE user_id = hr_user_id) THEN
            INSERT INTO leave_balances (
                id,
                user_id,
                casual_leave,
                sick_leave,
                privilege_leave,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                hr_user_id,
                6,  -- Casual leave
                6,  -- Sick leave
                18, -- Privilege leave
                NOW(),
                NOW()
            );
        END IF;
        
        -- 4. Create some sample employees for the HR to manage
        -- Sample Manager
        INSERT INTO users (
            id,
            username,
            password,
            name,
            email,
            role,
            department,
            country,
            manager_id,
            email_verified,
            created_at
        ) VALUES (
            gen_random_uuid(),
            'test_manager',
            'manager123',
            'Test Manager',
            'test.manager@company.com',
            'manager',
            'Engineering',
            'Morocco',
            NULL,
            TRUE,
            NOW()
        ) ON CONFLICT (username) DO NOTHING;
        
        -- Sample Employee 1
        INSERT INTO users (
            id,
            username,
            password,
            name,
            email,
            role,
            department,
            country,
            manager_id,
            email_verified,
            created_at
        ) VALUES (
            gen_random_uuid(),
            'test_employee1',
            'emp123',
            'Test Employee One',
            'test.employee1@company.com',
            'employee',
            'Engineering',
            'Morocco',
            (SELECT id FROM users WHERE username = 'test_manager'),
            TRUE,
            NOW()
        ) ON CONFLICT (username) DO NOTHING;
        
        -- Sample Employee 2
        INSERT INTO users (
            id,
            username,
            password,
            name,
            email,
            role,
            department,
            country,
            manager_id,
            email_verified,
            created_at
        ) VALUES (
            gen_random_uuid(),
            'test_employee2',
            'emp123',
            'Test Employee Two',
            'test.employee2@company.com',
            'employee',
            'Marketing',
            'Morocco',
            (SELECT id FROM users WHERE username = 'test_manager'),
            TRUE,
            NOW()
        ) ON CONFLICT (username) DO NOTHING;
        
        -- 5. Create leave balances for sample users (check if exists first)
        INSERT INTO leave_balances (id, user_id, casual_leave, sick_leave, privilege_leave, created_at, updated_at)
        SELECT 
            gen_random_uuid(),
            u.id,
            6, 6, 18,
            NOW(),
            NOW()
        FROM users u 
        WHERE u.username IN ('test_manager', 'test_employee1', 'test_employee2')
        AND NOT EXISTS (SELECT 1 FROM leave_balances lb WHERE lb.user_id = u.id);
        
        -- 6. Create sample leave requests for testing
        -- Pending request
        INSERT INTO leave_requests (
            id,
            user_id,
            leave_type,
            start_date,
            end_date,
            reason,
            is_half_day,
            status,
            requested_at
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM users WHERE username = 'test_employee1'),
            'casual',
            CURRENT_DATE + INTERVAL '7 days',
            CURRENT_DATE + INTERVAL '8 days',
            'Personal appointment',
            FALSE,
            'pending',
            NOW()
        );
        
        -- Approved request
        INSERT INTO leave_requests (
            id,
            user_id,
            leave_type,
            start_date,
            end_date,
            reason,
            is_half_day,
            status,
            requested_at,
            processed_at,
            processed_by,
            comments
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM users WHERE username = 'test_employee2'),
            'privilege',
            CURRENT_DATE - INTERVAL '5 days',
            CURRENT_DATE - INTERVAL '3 days',
            'Annual vacation',
            FALSE,
            'approved',
            NOW() - INTERVAL '10 days',
            NOW() - INTERVAL '8 days',
            hr_user_id,
            'Approved for annual vacation'
        );
        
        -- Rejected request
        INSERT INTO leave_requests (
            id,
            user_id,
            leave_type,
            start_date,
            end_date,
            reason,
            is_half_day,
            status,
            requested_at,
            processed_at,
            processed_by,
            comments
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM users WHERE username = 'test_employee1'),
            'sick',
            CURRENT_DATE + INTERVAL '15 days',
            CURRENT_DATE + INTERVAL '20 days',
            'Medical procedure',
            FALSE,
            'rejected',
            NOW() - INTERVAL '5 days',
            NOW() - INTERVAL '2 days',
            hr_user_id,
            'Please provide medical certificate'
        );
        
        -- Half-day request
        INSERT INTO leave_requests (
            id,
            user_id,
            leave_type,
            start_date,
            end_date,
            reason,
            is_half_day,
            status,
            requested_at
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM users WHERE username = 'test_employee2'),
            'casual',
            CURRENT_DATE + INTERVAL '3 days',
            CURRENT_DATE + INTERVAL '3 days',
            'Doctor appointment',
            TRUE,
            'pending',
            NOW()
        );
        
        RAISE NOTICE 'HR user created successfully with ID: %', hr_user_id;
        RAISE NOTICE 'Sample employees and leave requests created for testing';
        
    ELSE
        RAISE NOTICE 'HR user already exists or creation failed';
    END IF;
END $$;

-- 7. Display created users for verification
SELECT 
    u.username,
    u.name,
    u.role,
    u.department,
    u.country,
    u.email_verified,
    lb.casual_leave,
    lb.sick_leave,
    lb.privilege_leave
FROM users u
LEFT JOIN leave_balances lb ON u.id = lb.user_id
WHERE u.username IN ('hr_test', 'test_manager', 'test_employee1', 'test_employee2')
ORDER BY u.role DESC, u.username;

-- 8. Display sample leave requests
SELECT 
    lr.id,
    u.name as employee_name,
    u.department,
    lr.leave_type,
    lr.start_date,
    lr.end_date,
    lr.is_half_day,
    lr.status,
    lr.reason,
    lr.requested_at,
    lr.comments
FROM leave_requests lr
JOIN users u ON lr.user_id = u.id
WHERE u.username IN ('test_employee1', 'test_employee2')
ORDER BY lr.requested_at DESC;

-- 9. Grant necessary permissions (if needed)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 10. Final verification message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'HR TEST USER CREATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Login Credentials:';
    RAISE NOTICE 'Username: hr_test';
    RAISE NOTICE 'Password: hr123';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Additional Test Users Created:';
    RAISE NOTICE 'Manager: test_manager / manager123';
    RAISE NOTICE 'Employee 1: test_employee1 / emp123';
    RAISE NOTICE 'Employee 2: test_employee2 / emp123';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Sample leave requests created for testing:';
    RAISE NOTICE '- Pending casual leave request';
    RAISE NOTICE '- Approved privilege leave request';
    RAISE NOTICE '- Rejected sick leave request';
    RAISE NOTICE '- Pending half-day casual leave request';
    RAISE NOTICE '========================================';
END $$;
