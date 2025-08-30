-- Quick fix for interview_status enum mismatch
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the existing enum type (this will also drop the dependent column)
DROP TYPE IF EXISTS interview_status CASCADE;

-- Step 2: Create the correct enum with all values
CREATE TYPE interview_status AS ENUM ('SCHEDULED','COMPLETED','NO_SHOW','HIRED','REJECTED');

-- Step 3: Recreate the interviews table with the new enum type
-- (The table will be dropped when we drop the enum, so we need to recreate it)
CREATE TABLE interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id),
  candidate_name text NOT NULL,
  phone text,
  email text,
  position text,
  interview_date date NOT NULL,
  interview_time time NOT NULL,
  status interview_status NOT NULL DEFAULT 'SCHEDULED',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Step 4: Restore data from your seed.sql or existing data
-- If you had existing interview data, you'll need to re-insert it
-- with the correct enum values (SCHEDULED, COMPLETED, NO_SHOW, HIRED, REJECTED)
