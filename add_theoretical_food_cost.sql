-- Add theoretical_food_cost column to omega_daily table
-- Run this in your Supabase SQL Editor

-- Add the new column
ALTER TABLE omega_daily ADD COLUMN theoretical_food_cost NUMERIC;

-- Update the column to be NOT NULL with a default value of 0 for existing records
UPDATE omega_daily SET theoretical_food_cost = 0 WHERE theoretical_food_cost IS NULL;
ALTER TABLE omega_daily ALTER COLUMN theoretical_food_cost SET NOT NULL;

-- Drop the old computed column
ALTER TABLE omega_daily DROP COLUMN food_variance_percentage;

-- Recreate the computed column with the new formula
ALTER TABLE omega_daily ADD COLUMN food_variance_percentage NUMERIC GENERATED ALWAYS AS (
  CASE WHEN theoretical_food_cost = 0 THEN 0 ELSE (food_variance_cost / theoretical_food_cost) * 100 END
) STORED;

-- Update seed data to include theoretical_food_cost values
-- You can customize these values based on your typical theoretical food costs
UPDATE omega_daily SET theoretical_food_cost = net_sales * 0.30 WHERE theoretical_food_cost = 0;




