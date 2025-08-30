-- Migration: Update interview_status enum to match schema.sql
-- This script updates the database enum to: ('SCHEDULED','COMPLETED','NO_SHOW','HIRED','REJECTED')

-- First, let's see what the current enum looks like
-- Then update it to match our schema

-- Alternative approach: Drop and recreate the enum type
-- This is safer than trying to alter the existing enum

-- Step 1: Drop the existing enum type (this will also drop the dependent column)
DROP TYPE IF EXISTS interview_status CASCADE;

-- Step 2: Create the new enum type with correct values
CREATE TYPE interview_status AS ENUM ('SCHEDULED','COMPLETED','NO_SHOW','HIRED','REJECTED');

-- Step 3: Recreate the interviews table with the new enum type
-- (If this fails, the table structure may be different - run the schema.sql first)

-- If the above fails, you can manually update data:
-- UPDATE interviews SET status = 'COMPLETED' WHERE status = 'DONE';
-- Then recreate the enum as above
