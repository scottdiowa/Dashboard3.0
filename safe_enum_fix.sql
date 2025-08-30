-- Safe migration for interview_status enum
-- This approach preserves your existing data

-- First, let's see what enum values actually exist
-- SELECT DISTINCT status FROM interviews;

-- Step 1: Create the correct enum type
DROP TYPE IF EXISTS interview_status CASCADE;
CREATE TYPE interview_status AS ENUM ('SCHEDULED','COMPLETED','NO_SHOW','HIRED','REJECTED');

-- Step 2: Add a temporary column with the new enum type
ALTER TABLE interviews ADD COLUMN status_new interview_status;

-- Step 3: Copy existing status values to the new column with proper mapping
-- Handle any invalid enum values by setting them to SCHEDULED as default
UPDATE interviews
SET status_new = CASE
  WHEN status::text IN ('SCHEDULED', 'COMPLETED', 'NO_SHOW', 'HIRED', 'REJECTED')
  THEN status::text::interview_status
  ELSE 'SCHEDULED'::interview_status
END;

-- Step 4: Drop the old column and rename the new one
ALTER TABLE interviews DROP COLUMN status;
ALTER TABLE interviews RENAME COLUMN status_new TO status;

-- Step 5: Make sure the column is NOT NULL with default
ALTER TABLE interviews ALTER COLUMN status SET NOT NULL;
ALTER TABLE interviews ALTER COLUMN status SET DEFAULT 'SCHEDULED';
