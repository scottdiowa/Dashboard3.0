-- Goals table fix for Dashboard 3.0
-- Run this in your Supabase SQL Editor to fix existing table

-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS goals_isolate ON goals;

-- Create the goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('week','month','custom')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  sales_target numeric NOT NULL DEFAULT 0,
  labor_target_pct numeric NOT NULL DEFAULT 0,
  waste_target_pct numeric NOT NULL DEFAULT 0,
  food_variance_target_pct numeric NOT NULL DEFAULT 0,
  service_seconds_target numeric NOT NULL DEFAULT 0,
  team_notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (store_id, period_start, period_end)
);

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for goals (this will work now)
CREATE POLICY goals_isolate ON goals
  FOR ALL USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()))
  WITH CHECK (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_goals_store_period ON goals(store_id, period_start, period_end);

-- Grant necessary permissions
GRANT ALL ON goals TO authenticated;
GRANT ALL ON goals TO service_role;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;
