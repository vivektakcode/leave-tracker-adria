-- Update Database Schema for Superadmin/HR Role and Multi-Country Support
-- Run this in Supabase SQL Editor

-- 1. Add country column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'UAE';

-- 2. Update role enum to include 'hr' (superadmin)
-- First, create a new enum type
CREATE TYPE user_role_new AS ENUM ('employee', 'manager', 'hr');

-- Update existing rows to use new enum
UPDATE users SET role = 'employee' WHERE role NOT IN ('employee', 'manager', 'hr');

-- Alter the column to use new enum
ALTER TABLE users ALTER COLUMN role TYPE user_role_new USING role::text::user_role_new;

-- Drop the old enum and rename the new one
DROP TYPE IF EXISTS user_role_old;
ALTER TYPE user_role_new RENAME TO user_role;

-- 3. Add holiday_calendars table for HR management
CREATE TABLE IF NOT EXISTS holiday_calendars (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  year INTEGER NOT NULL,
  holidays JSONB NOT NULL DEFAULT '[]',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country, year)
);

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_holiday_calendars_country_year ON holiday_calendars(country, year);

-- 5. Update existing users to have country (if not set)
UPDATE users SET country = 'UAE' WHERE country IS NULL;

-- 6. Add RLS policies for holiday_calendars
ALTER TABLE holiday_calendars ENABLE ROW LEVEL SECURITY;

-- HR can manage all holiday calendars
CREATE POLICY "HR can manage holiday calendars" ON holiday_calendars
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'hr'
    )
  );

-- Everyone can view holiday calendars
CREATE POLICY "Everyone can view holiday calendars" ON holiday_calendars
  FOR SELECT USING (true);

-- 7. Update users table RLS policies
-- HR can manage all users
CREATE POLICY "HR can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'hr'
    )
  );

-- Managers can view their team members
CREATE POLICY "Managers can view team members" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
      AND users.id = users.manager_id
    )
  );

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- 8. Sample holiday data for UAE (2024-2025)
INSERT INTO holiday_calendars (id, country, year, holidays, created_by) VALUES
(
  'uae-2024',
  'UAE',
  2024,
  '[
    {"date": "2024-01-01", "name": "New Year", "type": "public"},
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
  (SELECT id FROM users WHERE role = 'hr' LIMIT 1)
) ON CONFLICT (country, year) DO NOTHING;

-- 9. Update existing users to have proper countries (example)
UPDATE users SET country = 'UAE' WHERE email LIKE '%@adria-bt.com';
UPDATE users SET country = 'UAE' WHERE email LIKE '%@gmail.com' AND country = 'UAE';

-- 10. Create function to get holidays for a country and date range
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

-- 11. Create function to calculate working days (excluding holidays)
CREATE OR REPLACE FUNCTION calculate_working_days(
  start_date DATE,
  end_date DATE,
  country_param TEXT DEFAULT 'UAE'
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

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 13. Create view for user management (HR use)
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

-- Grant access to the view
GRANT SELECT ON user_management_view TO anon, authenticated;

COMMENT ON TABLE holiday_calendars IS 'Holiday calendar management for HR';
COMMENT ON TABLE users IS 'Users table with role-based access control';
COMMENT ON FUNCTION get_holidays_for_period IS 'Get holidays for a specific country and date range';
COMMENT ON FUNCTION calculate_working_days IS 'Calculate working days excluding holidays';
