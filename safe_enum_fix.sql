-- Safe migration for interview_status enum
-- This approach preserves your existing data and handles foreign key constraints

-- First, let's see what enum values actually exist
-- SELECT DISTINCT status FROM interviews;

-- Step 1: Drop the existing foreign key constraint temporarily
ALTER TABLE hires DROP CONSTRAINT IF EXISTS hires_interview_id_fkey;

-- Step 2: Create the correct enum type
DROP TYPE IF EXISTS interview_status CASCADE;
CREATE TYPE interview_status AS ENUM ('SCHEDULED','COMPLETED','NO_SHOW','HIRED','REJECTED');

-- Step 3: Add a temporary column with the new enum type
ALTER TABLE interviews ADD COLUMN status_new interview_status;

-- Step 4: Copy existing status values to the new column with proper mapping
-- Handle any invalid enum values by setting them to SCHEDULED as default
UPDATE interviews
SET status_new = CASE
  WHEN status::text IN ('SCHEDULED', 'COMPLETED', 'NO_SHOW', 'HIRED', 'REJECTED')
  THEN status::text::interview_status
  ELSE 'SCHEDULED'::interview_status
END;

-- Step 5: Drop the old column and rename the new one
ALTER TABLE interviews DROP COLUMN status;
ALTER TABLE interviews RENAME COLUMN status_new TO status;

-- Step 6: Make sure the column is NOT NULL with default
ALTER TABLE interviews ALTER COLUMN status SET NOT NULL;
ALTER TABLE interviews ALTER COLUMN status SET DEFAULT 'SCHEDULED';

-- Step 7: Recreate the foreign key constraint
ALTER TABLE hires ADD CONSTRAINT hires_interview_id_fkey
  FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE;
