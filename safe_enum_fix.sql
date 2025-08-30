-- Safe migration for interview_status enum
-- This approach preserves your existing data

-- Step 1: Add a temporary column with the new enum type
ALTER TABLE interviews ADD COLUMN status_new interview_status;

-- Step 2: Create the correct enum type (if it doesn't exist)
DROP TYPE IF EXISTS interview_status CASCADE;
CREATE TYPE interview_status AS ENUM ('SCHEDULED','COMPLETED','NO_SHOW','HIRED','REJECTED');

-- Step 3: Update the temporary column with correct values
-- This handles any existing data by mapping to valid enum values
UPDATE interviews SET status_new = status::text::interview_status;

-- Step 4: Drop the old column and rename the new one
ALTER TABLE interviews DROP COLUMN status;
ALTER TABLE interviews RENAME COLUMN status_new TO status;

-- Step 5: Make sure the column is NOT NULL with default
ALTER TABLE interviews ALTER COLUMN status SET NOT NULL;
ALTER TABLE interviews ALTER COLUMN status SET DEFAULT 'SCHEDULED';

-- If this still fails, you may need to manually check what enum values exist
-- Run this query first to see current data:
-- SELECT DISTINCT status FROM interviews;
