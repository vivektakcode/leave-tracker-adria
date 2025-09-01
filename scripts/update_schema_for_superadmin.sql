-- Customized Schema Update for Leave Tracker Adria
-- This script is designed to work with your existing UUID-based data structure

-- 1. Add country column to users table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'country') THEN
        ALTER TABLE users ADD COLUMN country TEXT NOT NULL;
    END IF;
END $$;

-- 2. Update existing users to have country (based on email patterns)
UPDATE users SET country = 'Morocco' WHERE email LIKE '%@adria-bt.com';
UPDATE users SET country = 'Morocco' WHERE email LIKE '%@gmail.com' AND country IS NULL;
UPDATE users SET country = 'Morocco' WHERE country IS NULL;

-- 3. Create holiday_calendars table (if not exists) - using UUID for created_by
CREATE TABLE IF NOT EXISTS holiday_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  year INTEGER NOT NULL,
  holidays JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country, year)
);

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_holiday_calendars_country_year ON holiday_calendars(country, year);

-- 5. Create sample holiday data for all countries (2024-2025)
-- Morocco
INSERT INTO holiday_calendars (id, country, year, holidays, created_by) VALUES
(
  gen_random_uuid(),
  'Morocco',
  2024,
  '[
    {"date": "2024-01-01", "name": "New Year", "type": "public"},
    {"date": "2024-01-11", "name": "Independence Manifesto Day", "type": "public"},
    {"date": "2024-04-10", "name": "Eid Al-Fitr", "type": "public"},
    {"date": "2024-04-11", "name": "Eid Al-Fitr", "type": "public"},
    {"date": "2024-05-01", "name": "Labor Day", "type": "public"},
    {"date": "2024-06-17", "name": "Eid Al-Adha", "type": "public"},
    {"date": "2024-06-18", "name": "Eid Al-Adha", "type": "public"},
    {"date": "2024-07-19", "name": "Islamic New Year", "type": "public"},
    {"date": "2024-07-30", "name": "Throne Day", "type": "public"},
    {"date": "2024-08-14", "name": "Oued Ed-Dahab Day", "type": "public"},
    {"date": "2024-08-20", "name": "Revolution Day", "type": "public"},
    {"date": "2024-09-27", "name": "Prophet Muhammad Birthday", "type": "public"},
    {"date": "2024-11-06", "name": "Green March Day", "type": "public"},
    {"date": "2024-11-18", "name": "Independence Day", "type": "public"}
  ]',
  (SELECT id FROM users WHERE role = 'manager' LIMIT 1)
) ON CONFLICT (country, year) DO NOTHING;

-- India
INSERT INTO holiday_calendars (id, country, year, holidays, created_by) VALUES
(
  gen_random_uuid(),
  'India',
  2024,
  '[
    {"date": "2024-01-01", "name": "New Year", "type": "public"},
    {"date": "2024-01-26", "name": "Republic Day", "type": "public"},
    {"date": "2024-03-25", "name": "Holi", "type": "public"},
    {"date": "2024-04-10", "name": "Eid Al-Fitr", "type": "public"},
    {"date": "2024-04-11", "name": "Eid Al-Fitr", "type": "public"},
    {"date": "2024-05-01", "name": "Labor Day", "type": "public"},
    {"date": "2024-06-17", "name": "Eid Al-Adha", "type": "public"},
    {"date": "2024-06-18", "name": "Eid Al-Adha", "type": "public"},
    {"date": "2024-07-19", "name": "Islamic New Year", "type": "public"},
    {"date": "2024-08-15", "name": "Independence Day", "type": "public"},
    {"date": "2024-09-27", "name": "Prophet Muhammad Birthday", "type": "public"},
    {"date": "2024-10-02", "name": "Gandhi Jayanti", "type": "public"},
    {"date": "2024-11-14", "name": "Children\'s Day", "type": "public"}
  ]',
  (SELECT id FROM users WHERE role = 'manager' LIMIT 1)
) ON CONFLICT (country, year) DO NOTHING;

-- Tunisia
INSERT INTO holiday_calendars (id, country, year, holidays, created_by) VALUES
(
  gen_random_uuid(),
  'Tunisia',
  2024,
  '[
    {"date": "2024-01-01", "name": "New Year", "type": "public"},
    {"date": "2024-01-14", "name": "Revolution Day", "type": "public"},
    {"date": "2024-03-20", "name": "Independence Day", "type": "public"},
    {"date": "2024-04-10", "name": "Eid Al-Fitr", "type": "public"},
    {"date": "2024-04-11", "name": "Eid Al-Fitr", "type": "public"},
    {"date": "2024-05-01", "name": "Labor Day", "type": "public"},
    {"date": "2024-06-17", "name": "Eid Al-Adha", "type": "public"},
    {"date": "2024-06-18", "name": "Eid Al-Adha", "type": "public"},
    {"date": "2024-07-19", "name": "Islamic New Year", "type": "public"},
    {"date": "2024-07-25", "name": "Republic Day", "type": "public"},
    {"date": "2024-09-27", "name": "Prophet Muhammad Birthday", "type": "public"},
    {"date": "2024-10-15", "name": "Evacuation Day", "type": "public"}
  ]',
  (SELECT id FROM users WHERE role = 'manager' LIMIT 1)
) ON CONFLICT (country, year) DO NOTHING;

-- Senegal
INSERT INTO holiday_calendars (id, country, year, holidays, created_by) VALUES
(
  gen_random_uuid(),
  'Senegal',
  2024,
  '[
    {"date": "2024-01-01", "name": "New Year", "type": "public"},
    {"date": "2024-04-04", "name": "Independence Day", "type": "public"},
    {"date": "2024-04-10", "name": "Eid Al-Fitr", "type": "public"},
    {"date": "2024-04-11", "name": "Eid Al-Fitr", "type": "public"},
    {"date": "2024-05-01", "name": "Labor Day", "type": "public"},
    {"date": "2024-06-17", "name": "Eid Al-Adha", "type": "public"},
    {"date": "2024-06-18", "name": "Eid Al-Adha", "type": "public"},
    {"date": "2024-07-19", "name": "Islamic New Year", "type": "public"},
    {"date": "2024-08-15", "name": "Assumption Day", "type": "public"},
    {"date": "2024-09-27", "name": "Prophet Muhammad Birthday", "type": "public"},
    {"date": "2024-11-01", "name": "All Saints Day", "type": "public"}
  ]',
  (SELECT id FROM users WHERE role = 'manager' LIMIT 1)
) ON CONFLICT (country, year) DO NOTHING;

-- UAE
INSERT INTO holiday_calendars (id, country, year, holidays, created_by) VALUES
(
  gen_random_uuid(),
  'UAE',
  2024,
  '[
    {"date": "2024-01-01", "name": "New Year", "type": "public"},
    {"date": "2024-04-10", "name": "Eid Al-Fitr", "type": "public"},
    {"date": "2024-04-11", "name": "Eid Al-Fitr", "type": "public"},
    {"date": "2024-06-17", "name": "Eid Al-Adha", "type": "public"},
    {"date": "2024-06-18", "name": "Eid Al-Adha", "type": "public"},
    {"date": "2024-07-19", "name": "Islamic New Year", "type": "public"},
    {"date": "2024-09-27", "name": "Prophet Muhammad Birthday", "type": "public"},
    {"date": "2024-12-02", "name": "UAE National Day", "type": "public"},
    {"date": "2024-12-03", "name": "UAE National Day", "type": "public"}
  ]',
  (SELECT id FROM users WHERE role = 'manager' LIMIT 1)
) ON CONFLICT (country, year) DO NOTHING;

-- 6. Create function to get holidays for a country and date range
CREATE OR REPLACE FUNCTION get_holidays_for_period(
  country_param TEXT,
  start_date DATE,
  end_date DATE
) RETURNS TABLE (
  holiday_date DATE,
  holiday_name TEXT,
  holiday_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (h->>'date')::DATE as holiday_date,
    h->>'name' as holiday_name,
    h->>'type' as holiday_type
  FROM holiday_calendars hc,
       jsonb_array_elements(hc.holidays) h
  WHERE hc.country = country_param
    AND (h->>'date')::DATE BETWEEN start_date AND end_date
  ORDER BY holiday_date;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to calculate working days (excluding holidays)
CREATE OR REPLACE FUNCTION calculate_working_days(
  start_date DATE,
  end_date DATE,
  country_param TEXT
) RETURNS INTEGER AS $$
DECLARE
  total_days INTEGER;
  holiday_count INTEGER;
BEGIN
  -- Calculate total days
  total_days := end_date - start_date + 1;
  
  -- Count holidays in the period
  SELECT COUNT(*) INTO holiday_count
  FROM get_holidays_for_period(country_param, start_date, end_date);
  
  -- Return working days (total - holidays)
  RETURN GREATEST(0, total_days - holiday_count);
END;
$$ LANGUAGE plpgsql;

-- 8. Add email verification fields to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'verification_token') THEN
        ALTER TABLE users ADD COLUMN verification_token TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'verification_expires') THEN
        ALTER TABLE users ADD COLUMN verification_expires TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 9. Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- 10. Create index for verification tokens
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);

-- 11. Add auto-approval logic to leave_requests table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leave_requests' AND column_name = 'auto_approved') THEN
        ALTER TABLE leave_requests ADD COLUMN auto_approved BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leave_requests' AND column_name = 'auto_approval_reason') THEN
        ALTER TABLE leave_requests ADD COLUMN auto_approval_reason TEXT;
    END IF;
END $$;

-- 12. Create function to check if leave should be auto-approved
CREATE OR REPLACE FUNCTION should_auto_approve_leave(
  start_date DATE,
  end_date DATE,
  leave_type TEXT,
  number_of_days NUMERIC
) RETURNS BOOLEAN AS $$
BEGIN
  -- Auto-approve if dates are in the past
  IF start_date < CURRENT_DATE THEN
    RETURN TRUE;
  END IF;
  
  -- Auto-approve CL for 1-2 days
  IF leave_type = 'casual' AND number_of_days <= 2 THEN
    RETURN TRUE;
  END IF;
  
  -- Auto-approve PL for any number of days
  IF leave_type = 'privilege' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 13. Create function to auto-approve eligible leaves
CREATE OR REPLACE FUNCTION auto_approve_eligible_leaves() RETURNS INTEGER AS $$
DECLARE
  request RECORD;
  auto_approved_count INTEGER := 0;
BEGIN
  FOR request IN 
    SELECT 
      lr.id,
      lr.user_id,
      lr.leave_type,
      lr.start_date,
      lr.end_date,
      lr.is_half_day,
      u.name as user_name
    FROM leave_requests lr
    JOIN users u ON lr.user_id = u.id
    WHERE lr.status = 'pending' 
      AND lr.processed_at IS NULL
      AND lr.auto_approved = FALSE
  LOOP
    -- Calculate number of days
    DECLARE
      days_count NUMERIC;
    BEGIN
      IF request.start_date = request.end_date THEN
        days_count := CASE WHEN request.is_half_day THEN 0.5 ELSE 1 END;
      ELSE
        days_count := (request.end_date - request.start_date + 1)::NUMERIC;
        IF request.is_half_day THEN
          days_count := GREATEST(0.5, days_count - 0.5);
        END IF;
      END IF;
      
      -- Check if should auto-approve
      IF should_auto_approve_leave(request.start_date, request.end_date, request.leave_type, days_count) THEN
        -- Auto-approve the request
        UPDATE leave_requests 
        SET 
          status = 'approved',
          processed_at = NOW(),
          processed_by = request.user_id,
          auto_approved = TRUE,
          auto_approval_reason = 'Auto-approved based on system rules',
          comments = COALESCE(comments, '') || ' [Auto-approved]'
        WHERE id = request.id;
        
        auto_approved_count := auto_approved_count + 1;
        
        -- Log the auto-approval
        RAISE NOTICE 'Auto-approved leave request % for user %', request.id, request.user_name;
      END IF;
    END;
  END LOOP;
  
  RETURN auto_approved_count;
END;
$$ LANGUAGE plpgsql;

-- 14. Create function to get pending leave requests for reminders
CREATE OR REPLACE FUNCTION get_pending_leave_reminders() RETURNS TABLE (
  request_id UUID,
  employee_name TEXT,
  employee_email TEXT,
  manager_name TEXT,
  manager_email TEXT,
  leave_type TEXT,
  start_date DATE,
  end_date DATE,
  days_pending INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lr.id as request_id,
    u.name as employee_name,
    u.email as employee_email,
    m.name as manager_name,
    m.email as manager_email,
    lr.leave_type,
    lr.start_date,
    lr.end_date,
    EXTRACT(DAY FROM (NOW() - lr.requested_at))::INTEGER as days_pending
  FROM leave_requests lr
  JOIN users u ON lr.user_id = u.id
  LEFT JOIN users m ON u.manager_id = m.id
  WHERE lr.status = 'pending'
    AND lr.processed_at IS NULL
    AND lr.requested_at < (NOW() - INTERVAL '3 days')
    AND u.manager_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 8. Create view for user management (HR use)
CREATE OR REPLACE VIEW user_management_view AS
SELECT 
  u.id,
  u.username,
  u.name,
  u.email,
  u.role,
  u.department,
  u.country,
  u.created_at,
  m.name as manager_name,
  m.department as manager_department,
  lb.casual_leave,
  lb.sick_leave,
  lb.privilege_leave
FROM users u
LEFT JOIN users m ON u.manager_id = m.id
LEFT JOIN leave_balances lb ON u.id = lb.user_id
ORDER BY u.role DESC, u.department, u.name;

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT SELECT ON user_management_view TO anon, authenticated;

-- 10. Add comments for documentation
COMMENT ON TABLE holiday_calendars IS 'Holiday calendar management for HR';
COMMENT ON FUNCTION get_holidays_for_period IS 'Get holidays for a specific country and date range';
COMMENT ON FUNCTION calculate_working_days IS 'Calculate working days excluding holidays';

-- 11. Create a simple HR user for testing (optional)
-- Uncomment the next line if you want to create an HR user for testing
-- UPDATE users SET role = 'hr' WHERE username = 'demoadmin' LIMIT 1;
