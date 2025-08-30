-- Weekending Sheet Table Setup
-- This table stores weekly operational data and metrics

-- Create the weekending_sheet table
CREATE TABLE IF NOT EXISTS weekending_sheet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  week_ending_date DATE NOT NULL,
  manager_name TEXT NOT NULL CHECK (manager_name IN ('Scott', 'Sophear', 'Letoya', 'Carissa')),
  
  -- Sales and Financial Data
  breakfast_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  late_night_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  discounts DECIMAL(10,2) NOT NULL DEFAULT 0,
  cash DECIMAL(10,2) NOT NULL DEFAULT 0,
  food_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  food_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  variance_dollars DECIMAL(10,2) NOT NULL DEFAULT 0,
  food_variance_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  labor DECIMAL(10,2) NOT NULL DEFAULT 0,
  credit_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  reason TEXT,
  
  -- WeLearn & Training Section
  onboarding BOOLEAN NOT NULL DEFAULT FALSE,
  crew_food_safety_quiz DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (crew_food_safety_quiz >= 0 AND crew_food_safety_quiz <= 100),
  mgr_food_safety_quiz DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (mgr_food_safety_quiz >= 0 AND mgr_food_safety_quiz <= 100),
  new_hire_name TEXT,
  terminations TEXT,
  term_date DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekending_sheet_store_id ON weekending_sheet(store_id);
CREATE INDEX IF NOT EXISTS idx_weekending_sheet_date ON weekending_sheet(week_ending_date DESC);
CREATE INDEX IF NOT EXISTS idx_weekending_sheet_manager ON weekending_sheet(manager_name);

-- Create a unique constraint to prevent duplicate entries for the same store and week
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekending_sheet_unique_store_week 
ON weekending_sheet(store_id, week_ending_date);

-- Enable Row Level Security (RLS)
ALTER TABLE weekending_sheet ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view weekending sheets for their store" ON weekending_sheet
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert weekending sheets for their store" ON weekending_sheet
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT store_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update weekending sheets for their store" ON weekending_sheet
  FOR UPDATE USING (
    store_id IN (
      SELECT store_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete weekending sheets for their store" ON weekending_sheet
  FOR DELETE USING (
    store_id IN (
      SELECT store_id FROM users WHERE id = auth.uid()
    )
  );

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_weekending_sheet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_weekending_sheet_updated_at
  BEFORE UPDATE ON weekending_sheet
  FOR EACH ROW
  EXECUTE FUNCTION update_weekending_sheet_updated_at();

-- Insert sample data (optional - for testing)
-- INSERT INTO weekending_sheet (
--   store_id,
--   week_ending_date,
--   manager_name,
--   breakfast_sales,
--   late_night_sales,
--   net_sales,
--   discounts,
--   cash,
--   food_total,
--   food_cost,
--   variance_dollars,
--   food_variance_percentage,
--   labor,
--   credit_hours,
--   reason,
--   onboarding,
--   crew_food_safety_quiz,
--   mgr_food_safety_quiz
-- ) VALUES (
--   'your-store-id-here',
--   '2024-01-06',
--   'Scott',
--   1250.50,
--   2100.75,
--   18500.00,
--   150.00,
--   4500.00,
--   12000.00,
--   11800.00,
--   -200.00,
--   -1.67,
--   3200.00,
--   85.5,
--   'Good week overall',
--   true,
--   95.5,
--   98.0
-- );

-- Grant permissions to authenticated users
GRANT ALL ON weekending_sheet TO authenticated;
GRANT USAGE ON SEQUENCE weekending_sheet_id_seq TO authenticated;
