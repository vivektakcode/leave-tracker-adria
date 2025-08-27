-- Fix Duplicate Leave Requests Before Creating Unique Constraint
-- This script will resolve existing duplicates so the unique index can be created

-- ===========================================
-- 1. IDENTIFY DUPLICATES
-- ===========================================

-- Find all duplicate leave requests
WITH duplicates AS (
  SELECT 
    user_id,
    start_date,
    end_date,
    status,
    COUNT(*) as count,
    ARRAY_AGG(id ORDER BY requested_at DESC) as request_ids
  FROM leave_requests
  WHERE status IN ('pending', 'approved')
  GROUP BY user_id, start_date, end_date, status
  HAVING COUNT(*) > 1
)
SELECT 
  'DUPLICATES FOUND:' as info,
  user_id,
  start_date,
  end_date,
  status,
  count,
  request_ids
FROM duplicates;

-- ===========================================
-- 2. RESOLVE DUPLICATES BY KEEPING THE LATEST
-- ===========================================

-- For each set of duplicates, keep only the most recent request
-- and mark others as rejected with a comment

-- First, let's see what we're dealing with
SELECT 
  'ANALYZING DUPLICATES:' as info,
  lr.user_id,
  lr.start_date,
  lr.end_date,
  lr.status,
  lr.requested_at,
  lr.reason,
  u.username
FROM leave_requests lr
JOIN users u ON lr.user_id = u.id
WHERE (lr.user_id, lr.start_date, lr.end_date, lr.status) IN (
  SELECT user_id, start_date, end_date, status
  FROM leave_requests
  WHERE status IN ('pending', 'approved')
  GROUP BY user_id, start_date, end_date, status
  HAVING COUNT(*) > 1
)
ORDER BY lr.user_id, lr.start_date, lr.end_date, lr.status, lr.requested_at DESC;

-- ===========================================
-- 3. RESOLVE DUPLICATES - KEEP LATEST, REJECT OTHERS
-- ===========================================

-- For each set of duplicates, keep the most recent and reject others
DO $$
DECLARE
  duplicate_record RECORD;
  latest_id UUID;
BEGIN
  FOR duplicate_record IN 
    SELECT 
      user_id,
      start_date,
      end_date,
      status
    FROM leave_requests
    WHERE status IN ('pending', 'approved')
    GROUP BY user_id, start_date, end_date, status
    HAVING COUNT(*) > 1
  LOOP
    -- Get the ID of the most recent request
    SELECT id INTO latest_id
    FROM leave_requests
    WHERE user_id = duplicate_record.user_id
      AND start_date = duplicate_record.start_date
      AND end_date = duplicate_record.end_date
      AND status = duplicate_record.status
    ORDER BY requested_at DESC
    LIMIT 1;
    
    -- Reject all other duplicate requests
    UPDATE leave_requests
    SET 
      status = 'rejected',
      processed_at = NOW(),
      processed_by = user_id, -- Self-rejection
      comments = 'Automatically rejected due to duplicate request - keeping most recent'
    WHERE user_id = duplicate_record.user_id
      AND start_date = duplicate_record.start_date
      AND end_date = duplicate_record.end_date
      AND status = duplicate_record.status
      AND id != latest_id;
      
    RAISE NOTICE 'Resolved duplicates for user %, dates % to %, kept request %', 
      duplicate_record.user_id, 
      duplicate_record.start_date, 
      duplicate_record.end_date, 
      latest_id;
  END LOOP;
END $$;

-- ===========================================
-- 4. VERIFY DUPLICATES ARE RESOLVED
-- ===========================================

-- Check if duplicates still exist
SELECT 
  'VERIFYING DUPLICATES RESOLVED:' as info,
  user_id,
  start_date,
  end_date,
  status,
  COUNT(*) as count
FROM leave_requests
WHERE status IN ('pending', 'approved')
GROUP BY user_id, start_date, end_date, status
HAVING COUNT(*) > 1;

-- ===========================================
-- 5. NOW CREATE THE UNIQUE INDEX
-- ===========================================

-- Create unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_dates 
ON leave_requests (user_id, start_date, end_date, status) 
WHERE status IN ('pending', 'approved');

-- ===========================================
-- 6. VERIFY THE CONSTRAINT WORKS
-- ===========================================

-- Check if the index was created successfully
SELECT 
  'UNIQUE INDEX CREATED:' as info,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'leave_requests' 
  AND indexname = 'idx_unique_user_dates';

-- ===========================================
-- 7. FINAL VERIFICATION
-- ===========================================

-- Show summary of all leave requests by status
SELECT 
  'FINAL STATUS SUMMARY:' as info,
  status,
  COUNT(*) as count
FROM leave_requests
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'approved' THEN 2
    WHEN 'rejected' THEN 3
    ELSE 4
  END;

-- Show some sample resolved requests
SELECT 
  'SAMPLE RESOLVED REQUESTS:' as info,
  username,
  leave_type,
  start_date,
  end_date,
  status,
  comments
FROM leave_requests
WHERE comments LIKE '%Automatically rejected%'
LIMIT 5; 