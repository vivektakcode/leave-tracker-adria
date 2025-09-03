-- Simple HR User Setup Script
-- This script creates one HR user for testing and updates existing data

-- 1. Update role constraint to allow HR role
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

-- 2. Update all existing users to have India as country
UPDATE users SET country = 'India' WHERE country != 'India';

-- 3. Create HR user (simple approach)
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
    'India',
    NULL,
    TRUE,
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- 4. Create leave balance for HR user
DO $$
DECLARE
    hr_user_id UUID;
BEGIN
    -- Get the HR user ID
    SELECT id INTO hr_user_id FROM users WHERE username = 'hr_test';
    
    IF hr_user_id IS NOT NULL THEN
        -- Create leave balance if it doesn't exist
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
        
        RAISE NOTICE 'HR user created successfully with ID: %', hr_user_id;
    ELSE
        RAISE NOTICE 'HR user already exists or creation failed';
    END IF;
END $$;

-- 5. Create 2025 holiday calendar for India
INSERT INTO holiday_calendars (
    id,
    country,
    year,
    holidays,
    created_by,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'India',
    2025,
    '[
        {"date": "2025-01-01", "name": "New Year", "type": "public"},
        {"date": "2025-01-26", "name": "Republic Day", "type": "public"},
        {"date": "2025-03-14", "name": "Holi", "type": "public"},
        {"date": "2025-03-30", "name": "Eid Al-Fitr", "type": "public"},
        {"date": "2025-03-31", "name": "Eid Al-Fitr", "type": "public"},
        {"date": "2025-04-14", "name": "Ambedkar Jayanti", "type": "public"},
        {"date": "2025-04-17", "name": "Ram Navami", "type": "public"},
        {"date": "2025-05-01", "name": "Labor Day", "type": "public"},
        {"date": "2025-06-06", "name": "Eid Al-Adha", "type": "public"},
        {"date": "2025-06-07", "name": "Eid Al-Adha", "type": "public"},
        {"date": "2025-06-26", "name": "Islamic New Year", "type": "public"},
        {"date": "2025-08-15", "name": "Independence Day", "type": "public"},
        {"date": "2025-08-26", "name": "Janmashtami", "type": "public"},
        {"date": "2025-09-16", "name": "Prophet Muhammad Birthday", "type": "public"},
        {"date": "2025-10-02", "name": "Gandhi Jayanti", "type": "public"},
        {"date": "2025-10-12", "name": "Dussehra", "type": "public"},
        {"date": "2025-10-31", "name": "Diwali", "type": "public"},
        {"date": "2025-11-01", "name": "Diwali", "type": "public"},
        {"date": "2025-11-14", "name": "Children''s Day", "type": "public"},
        {"date": "2025-12-25", "name": "Christmas", "type": "public"}
    ]',
    (SELECT id FROM users WHERE username = 'hr_test' LIMIT 1),
    NOW(),
    NOW()
) ON CONFLICT (country, year) DO NOTHING;

-- 6. Display results
SELECT 
    'HR User Created' as status,
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
WHERE u.username = 'hr_test';

-- 7. Show updated user countries
SELECT 
    'Updated Countries' as status,
    country,
    COUNT(*) as user_count
FROM users 
GROUP BY country
ORDER BY country;

-- 8. Show 2025 holiday calendar
SELECT 
    '2025 Holiday Calendar' as status,
    country,
    year,
    jsonb_array_length(holidays) as holiday_count
FROM holiday_calendars 
WHERE year = 2025 AND country = 'India';

-- 9. Final success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'HR USER SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'HR Login Credentials:';
    RAISE NOTICE 'Username: hr_test';
    RAISE NOTICE 'Password: hr1234';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All users updated to India country';
    RAISE NOTICE '2025 holiday calendar created for India';
    RAISE NOTICE '========================================';
END $$;
