-- Migration: Update interview_status enum from DONE to COMPLETED
-- This script updates the database to match the new schema

-- Step 1: Update existing data from 'DONE' to 'COMPLETED'
UPDATE interviews 
SET status = 'COMPLETED' 
WHERE status = 'DONE';

-- Step 2: Drop the old enum type (this will fail if there are still 'DONE' values)
-- We need to create a new column with the new enum type first

-- Step 3: Add a new status column with the new enum
ALTER TABLE interviews 
ADD COLUMN status_new interview_status;

-- Step 4: Copy data to the new column (converting DONE to COMPLETED)
UPDATE interviews 
SET status_new = CASE 
  WHEN status = 'DONE' THEN 'COMPLETED'::interview_status
  ELSE status::interview_status
END;

-- Step 5: Drop the old column and rename the new one
ALTER TABLE interviews DROP COLUMN status;
ALTER TABLE interviews RENAME COLUMN status_new TO status;

-- Step 6: Make the new status column NOT NULL
ALTER TABLE interviews ALTER COLUMN status SET NOT NULL;

-- Step 7: Set default value
ALTER TABLE interviews ALTER COLUMN status SET DEFAULT 'SCHEDULED';

-- Note: If you get errors about the enum type not existing, you may need to:
-- 1. Drop the old enum type first
-- 2. Create the new enum type
-- 3. Then run the above migration

-- Alternative approach if the above fails:
-- DROP TYPE interview_status CASCADE;
-- CREATE TYPE interview_status AS ENUM ('SCHEDULED','COMPLETED','NO_SHOW','HIRED','REJECTED');
-- Then manually update the table structure
