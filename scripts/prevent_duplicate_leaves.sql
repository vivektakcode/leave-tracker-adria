-- Prevent duplicate leave requests for the same user on overlapping dates
-- This script adds database-level constraints to ensure data integrity

-- Create a unique constraint to prevent duplicate leave requests
-- This will prevent the same user from having multiple pending/approved requests for overlapping dates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_dates 
ON leave_requests (user_id, start_date, end_date, status) 
WHERE status IN ('pending', 'approved');

-- Alternative approach: Create a function to check for overlapping dates
CREATE OR REPLACE FUNCTION check_overlapping_leaves()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there are any existing approved or pending leaves that overlap
  IF EXISTS (
    SELECT 1 FROM leave_requests 
    WHERE user_id = NEW.user_id 
      AND status IN ('pending', 'approved')
      AND id != NEW.id  -- Exclude the current record being updated
      AND (
        -- Check for date overlap
        (NEW.start_date <= end_date AND NEW.end_date >= start_date)
      )
  ) THEN
    RAISE EXCEPTION 'Leave request overlaps with existing approved or pending leave for this user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the overlap check
DROP TRIGGER IF EXISTS trigger_check_overlapping_leaves ON leave_requests;
CREATE TRIGGER trigger_check_overlapping_leaves
  BEFORE INSERT OR UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION check_overlapping_leaves();

-- Add a comment to document the constraint
COMMENT ON FUNCTION check_overlapping_leaves() IS 'Prevents overlapping leave requests for the same user';

-- Verify the constraint is working
-- You can test this by trying to insert overlapping leave requests 