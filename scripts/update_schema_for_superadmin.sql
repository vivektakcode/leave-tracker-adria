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
