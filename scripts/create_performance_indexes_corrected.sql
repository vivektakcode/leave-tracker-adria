-- Performance Indexes for Leave Management System
-- Corrected version with actual table names: users, leave_requests, leave_balances, holiday_calendars, password_reset_tokens

-- 1. Leave Requests Table Indexes
-- For fetching leave requests by user (employee panel)
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);

-- For fetching leave requests by manager (admin panel)
CREATE INDEX IF NOT EXISTS idx_leave_requests_manager_lookup ON leave_requests(user_id, status);

-- For date-based queries (recent requests, date filtering)
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- For status-based queries (pending, approved, rejected)
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- For leave type queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_type ON leave_requests(leave_type);

-- For ordering by request date (most recent first)
CREATE INDEX IF NOT EXISTS idx_leave_requests_requested_at ON leave_requests(requested_at DESC);

-- Composite index for manager dashboard queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_manager_composite ON leave_requests(user_id, status, requested_at DESC);

-- 2. Users Table Indexes
-- For email lookups (login, user creation)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- For manager lookups (finding users by manager)
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

-- For role-based queries (HR dashboard)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- For department-based queries
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- For country-based queries
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);

-- 3. Leave Balances Table Indexes
-- For fetching leave balances (employee dashboard)
CREATE INDEX IF NOT EXISTS idx_leave_balances_user_id ON leave_balances(user_id);

-- For leave balance updates
CREATE INDEX IF NOT EXISTS idx_leave_balances_user_updated ON leave_balances(user_id, updated_at DESC);

-- For leave type specific queries
CREATE INDEX IF NOT EXISTS idx_leave_balances_casual ON leave_balances(user_id, casual_leave);
CREATE INDEX IF NOT EXISTS idx_leave_balances_sick ON leave_balances(user_id, sick_leave);
CREATE INDEX IF NOT EXISTS idx_leave_balances_privilege ON leave_balances(user_id, privilege_leave);

-- 4. Holiday Calendars Table Indexes
-- For holiday lookups by country and year
CREATE INDEX IF NOT EXISTS idx_holiday_calendars_country_year ON holiday_calendars(country, year);

-- For created_by lookups
CREATE INDEX IF NOT EXISTS idx_holiday_calendars_created_by ON holiday_calendars(created_by);

-- For timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_holiday_calendars_created_at ON holiday_calendars(created_at);
CREATE INDEX IF NOT EXISTS idx_holiday_calendars_updated_at ON holiday_calendars(updated_at);

-- 5. Password Reset Tokens Table Indexes
-- For token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- 6. Additional Performance Indexes
-- For username lookups in leave requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_username ON leave_requests(username);

-- For manager name and department lookups
CREATE INDEX IF NOT EXISTS idx_leave_requests_manager_info ON leave_requests(manager_name, manager_department);

-- For processed requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_processed ON leave_requests(processed_at, processed_by);

-- For half-day leave queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_half_day ON leave_requests(is_half_day);

-- For auto-approval tracking
CREATE INDEX IF NOT EXISTS idx_leave_requests_auto_approved ON leave_requests(auto_approved);

-- For reminder tracking
CREATE INDEX IF NOT EXISTS idx_leave_requests_reminder_count ON leave_requests(reminder_count);
CREATE INDEX IF NOT EXISTS idx_leave_requests_last_reminder ON leave_requests(last_reminder_sent);

-- 7. Composite Indexes for Complex Queries
-- For HR dashboard: all users with their managers
CREATE INDEX IF NOT EXISTS idx_users_role_manager ON users(role, manager_id);

-- For leave request statistics
CREATE INDEX IF NOT EXISTS idx_leave_requests_stats ON leave_requests(leave_type, status, start_date);

-- For manager notification queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_notification ON leave_requests(user_id, status, requested_at);

-- 8. Partial Indexes for Better Performance
-- Only index pending requests (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_leave_requests_pending ON leave_requests(user_id, requested_at DESC) WHERE status = 'pending';

-- Only index approved requests for balance calculations
CREATE INDEX IF NOT EXISTS idx_leave_requests_approved ON leave_requests(user_id, leave_type, start_date, end_date) WHERE status = 'approved';

-- Only index active users
CREATE INDEX IF NOT EXISTS idx_users_active ON users(email, role) WHERE created_at IS NOT NULL;

-- 9. Foreign Key Indexes (if not automatically created)
-- These ensure foreign key lookups are fast
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_fk ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_fk ON users(manager_id);

-- 10. Text Search Indexes (if using full-text search)
-- For searching user names and emails
CREATE INDEX IF NOT EXISTS idx_users_name_search ON users USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_users_email_search ON users USING gin(to_tsvector('english', email));

-- Performance Analysis Queries
-- Run these to check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_scan DESC;

-- Check table sizes:
-- SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables 
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
