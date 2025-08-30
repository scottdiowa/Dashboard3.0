-- Simple enum fix - recreate the table structure
-- Use this if the safe migration fails

-- Step 1: Check what data exists first
-- SELECT * FROM interviews LIMIT 5;

-- Step 2: Create a backup of existing data
CREATE TABLE interviews_backup AS SELECT * FROM interviews;

-- Step 3: Drop the table (this also drops the enum)
DROP TABLE interviews;

-- Step 4: Recreate the enum with correct values
CREATE TYPE interview_status AS ENUM ('SCHEDULED','COMPLETED','NO_SHOW','HIRED','REJECTED');

-- Step 5: Recreate the table
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

-- Step 6: Restore data from backup (if you want to keep existing data)
-- INSERT INTO interviews (store_id, candidate_name, phone, email, position, interview_date, interview_time, status, notes, created_at)
-- SELECT store_id, candidate_name, phone, email, position, interview_date, interview_time,
--        CASE
--          WHEN status::text IN ('SCHEDULED', 'COMPLETED', 'NO_SHOW', 'HIRED', 'REJECTED')
--          THEN status::text::interview_status
--          ELSE 'SCHEDULED'::interview_status
--        END as status,
--        notes, created_at
-- FROM interviews_backup;

-- Step 7: Drop the backup table
-- DROP TABLE interviews_backup;
