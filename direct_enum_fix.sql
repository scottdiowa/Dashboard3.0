-- Direct enum fix - simplest approach
-- Run this in your Supabase SQL Editor

-- Step 1: Check what enum values currently exist
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
    SELECT oid FROM pg_type WHERE typname = 'interview_status'
) ORDER BY enumsortorder;

-- Step 2: Add missing enum values one by one
-- This is safer than dropping and recreating the enum

-- Add REJECTED if it doesn't exist
ALTER TYPE interview_status ADD VALUE IF NOT EXISTS 'REJECTED';

-- Verify the enum now has all values
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
    SELECT oid FROM pg_type WHERE typname = 'interview_status'
) ORDER BY enumsortorder;
