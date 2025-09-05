-- Goals table diagnosis and fix
-- Run this in your Supabase SQL Editor to check and fix the table structure

-- First, let's see what columns actually exist in the goals table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;

-- Check if the table exists and what it looks like
SELECT * FROM information_schema.tables WHERE table_name = 'goals';

-- Check the current table structure
\d goals;
