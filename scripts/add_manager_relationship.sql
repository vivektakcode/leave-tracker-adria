-- Add manager_id column to users table
ALTER TABLE users ADD COLUMN manager_id UUID REFERENCES users(id);

-- Create index for better performance on manager lookups
CREATE INDEX idx_users_manager_id ON users(manager_id);

-- Create index for better performance on role-based queries
CREATE INDEX idx_users_role ON users(role);

-- Add constraint to ensure manager_id references a user with manager role
-- This will be enforced at the application level for now
-- You can add a database trigger later if needed

-- Example: Update existing users to have a default manager (optional)
-- UPDATE users SET manager_id = (SELECT id FROM users WHERE role = 'manager' LIMIT 1) WHERE role = 'employee' AND manager_id IS NULL;

-- Verify the changes
SELECT 
  u1.username as employee_username,
  u1.role as employee_role,
  u2.username as manager_username,
  u2.role as manager_role
FROM users u1
LEFT JOIN users u2 ON u1.manager_id = u2.id
ORDER BY u1.role DESC, u1.username; 