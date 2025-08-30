-- Quick fix for interview_status enum mismatch
-- Run this in your Supabase SQL Editor

-- Step 1: Update any existing DONE values to COMPLETED
UPDATE interviews SET status = 'COMPLETED' WHERE status = 'DONE';

-- Step 2: Drop and recreate the enum type
DROP TYPE IF EXISTS interview_status CASCADE;

-- Step 3: Create the correct enum
CREATE TYPE interview_status AS ENUM ('SCHEDULED','COMPLETED','NO_SHOW','HIRED','REJECTED');

-- Step 4: Recreate the interviews table structure (copy from schema.sql if needed)
-- The table should be automatically recreated with the new enum type
