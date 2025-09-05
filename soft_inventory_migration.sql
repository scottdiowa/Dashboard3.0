-- Migration for Soft Inventory Analysis feature
-- Run this SQL in your Supabase SQL editor to add the soft inventory variance tracking
-- This tracks variance percentages for specific food items: Bacon, Beef 4oz, Beef Small, 
-- Chicken Breaded, Chicken Diced, Chicken Nuggets, Chicken Nuggets Spicy, Chicken Patty 3.1,
-- Chicken Breaded Spicy, Chicken Strips, and Sausage Patty

-- Create Soft Inventory Analysis table
CREATE TABLE IF NOT EXISTS soft_inventory_variance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  business_date date NOT NULL,
  bacon_variance numeric NOT NULL DEFAULT 0,
  beef_4oz_variance numeric NOT NULL DEFAULT 0,
  beef_small_variance numeric NOT NULL DEFAULT 0,
  chicken_breaded_variance numeric NOT NULL DEFAULT 0,
  chicken_diced_variance numeric NOT NULL DEFAULT 0,
  chicken_nuggets_variance numeric NOT NULL DEFAULT 0,
  chicken_nuggets_spicy_variance numeric NOT NULL DEFAULT 0,
  chicken_patty_3_1_variance numeric NOT NULL DEFAULT 0,
  chicken_breaded_spicy_variance numeric NOT NULL DEFAULT 0,
  chicken_strips_variance numeric NOT NULL DEFAULT 0,
  sausage_patty_variance numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index on store_id and business_date
CREATE UNIQUE INDEX IF NOT EXISTS idx_soft_inventory_variance_store_date ON soft_inventory_variance(store_id, business_date);

-- Enable RLS for soft_inventory_variance
ALTER TABLE soft_inventory_variance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for soft_inventory_variance
CREATE POLICY "Users can view their store's soft inventory variance data" ON soft_inventory_variance
  FOR SELECT USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert soft inventory variance data for their store" ON soft_inventory_variance
  FOR INSERT WITH CHECK (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their store's soft inventory variance data" ON soft_inventory_variance
  FOR UPDATE USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their store's soft inventory variance data" ON soft_inventory_variance
  FOR DELETE USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

-- Add comment to table
COMMENT ON TABLE soft_inventory_variance IS 'Tracks daily soft inventory variance percentages for specific food items';
COMMENT ON COLUMN soft_inventory_variance.business_date IS 'The business date for this variance entry';
COMMENT ON COLUMN soft_inventory_variance.notes IS 'Optional notes about the variance';
COMMENT ON COLUMN soft_inventory_variance.bacon_variance IS 'Bacon variance percentage (can be negative for shortage, positive for overage)';
COMMENT ON COLUMN soft_inventory_variance.beef_4oz_variance IS 'Beef 4oz variance percentage';
COMMENT ON COLUMN soft_inventory_variance.beef_small_variance IS 'Beef Small variance percentage';
COMMENT ON COLUMN soft_inventory_variance.chicken_breaded_variance IS 'Chicken Breaded variance percentage';
COMMENT ON COLUMN soft_inventory_variance.chicken_diced_variance IS 'Chicken Diced variance percentage';
COMMENT ON COLUMN soft_inventory_variance.chicken_nuggets_variance IS 'Chicken Nuggets variance percentage';
COMMENT ON COLUMN soft_inventory_variance.chicken_nuggets_spicy_variance IS 'Chicken Nuggets Spicy variance percentage';
COMMENT ON COLUMN soft_inventory_variance.chicken_patty_3_1_variance IS 'Chicken Patty 3.1 variance percentage';
COMMENT ON COLUMN soft_inventory_variance.chicken_breaded_spicy_variance IS 'Chicken Breaded Spicy variance percentage';
COMMENT ON COLUMN soft_inventory_variance.chicken_strips_variance IS 'Chicken Strips variance percentage';
COMMENT ON COLUMN soft_inventory_variance.sausage_patty_variance IS 'Sausage Patty variance percentage';
