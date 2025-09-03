-- Create password_reset_tokens table for forgot password functionality
-- This table stores temporary tokens for password reset requests

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Add comment to table
COMMENT ON TABLE password_reset_tokens IS 'Stores temporary tokens for password reset requests';

-- Add comments to columns
COMMENT ON COLUMN password_reset_tokens.id IS 'Unique identifier for the reset token record';
COMMENT ON COLUMN password_reset_tokens.user_id IS 'Reference to the user requesting password reset';
COMMENT ON COLUMN password_reset_tokens.token IS 'Unique token string for password reset';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'When the token expires (typically 1 hour)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'When the token was used (NULL if not used yet)';
COMMENT ON COLUMN password_reset_tokens.created_at IS 'When the token was created';

-- Create a function to clean up expired tokens (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION cleanup_expired_reset_tokens() IS 'Removes expired and used password reset tokens';

-- You can run this function periodically to clean up old tokens
-- SELECT cleanup_expired_reset_tokens();
