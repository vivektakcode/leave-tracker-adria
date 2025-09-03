-- Remove email verification functionality
-- This script removes the email_verification_tokens table and related functionality
-- since we've replaced email verification with immediate signup

-- Drop the email_verification_tokens table
DROP TABLE IF EXISTS email_verification_tokens CASCADE;

-- Remove email verification related columns from users table (if they exist)
-- Note: These columns might not exist in all deployments
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
ALTER TABLE users DROP COLUMN IF EXISTS verification_token;
ALTER TABLE users DROP COLUMN IF EXISTS verification_expires;

-- Add comment
COMMENT ON TABLE users IS 'Users table - email verification removed, immediate signup enabled';
