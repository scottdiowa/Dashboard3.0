-- Goals table for Goal Setting tab
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  scope text not null check (scope in ('week','month','custom')),
  period_start date not null,
  period_end date not null,
  sales_target numeric not null default 0,
  labor_target_pct numeric not null default 0,
  waste_target_pct numeric not null default 0,
  food_variance_target_pct numeric not null default 0,
  service_seconds_target numeric not null default 0,
  team_notes text,
  created_at timestamp with time zone default now(),
  unique (store_id, period_start, period_end)
);
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create stores table
CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create users table linked to auth.users
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id),
  role text NOT NULL DEFAULT 'gm',
  created_at timestamptz DEFAULT now()
);

-- Create Omega Daily table for daily business metrics
CREATE TABLE omega_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id),
  business_date date NOT NULL,
  net_sales numeric NOT NULL,
  last_year_sales numeric NOT NULL,
  comp_net_sales numeric GENERATED ALWAYS AS (net_sales - last_year_sales) STORED,
  labor_hours numeric NOT NULL,
  ideal_labor_hours numeric NOT NULL,
  labor_hours_diff numeric GENERATED ALWAYS AS (labor_hours - ideal_labor_hours) STORED,
  labor_percentage numeric NOT NULL,
  theoretical_food_cost numeric NOT NULL,
  food_variance_cost numeric NOT NULL,
  food_variance_percentage numeric GENERATED ALWAYS AS (
    CASE WHEN theoretical_food_cost = 0 THEN 0 ELSE (food_variance_cost / theoretical_food_cost) * 100 END
  ) STORED,
  waste_amount numeric NOT NULL,
  waste_percentage numeric GENERATED ALWAYS AS (
    CASE WHEN net_sales = 0 THEN 0 ELSE (waste_amount / net_sales) * 100 END
  ) STORED,
  breakfast_sales numeric NOT NULL,
  night_sales numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create unique index on store_id and business_date
CREATE UNIQUE INDEX ON omega_daily (store_id, business_date);

-- Create interview status enum
CREATE TYPE interview_status AS ENUM ('SCHEDULED','DONE','NO_SHOW','HIRED','REJECTED');

-- Create interviews table
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

-- Create hiring process table
CREATE TABLE hires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id),
  interview_id uuid UNIQUE NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  documents_received boolean DEFAULT false,
  documents_folder text, -- Supabase Storage path
  onboarding_sent_date date,
  onboarding_completed_date date,
  manager_reviewed_date date,
  entered_in_system_date date,
  fingerprint_scheduled_date date,
  first_day date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create SMG daily entries table
CREATE TABLE smg_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id),
  entry_date date NOT NULL,
  accuracy_of_order numeric,
  zone_of_defection numeric,
  customer_computers numeric,
  taste_of_food numeric,
  osat numeric,
  created_at timestamptz DEFAULT now()
);

-- Create unique index on store_id and entry_date
CREATE UNIQUE INDEX ON smg_entries (store_id, entry_date);

-- Create view for SMG monthly aggregations
CREATE VIEW smg_monthly AS
SELECT
  store_id,
  date_trunc('month', entry_date)::date AS month_start,
  AVG(accuracy_of_order) AS avg_accuracy_of_order,
  AVG(zone_of_defection) AS avg_zone_of_defection,
  AVG(customer_computers) AS avg_customer_computers,
  AVG(taste_of_food) AS avg_taste_of_food,
  AVG(osat) AS avg_osat,
  COUNT(*) AS total_entries
FROM smg_entries
GROUP BY store_id, date_trunc('month', entry_date);

-- Enable Row Level Security on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE omega_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE hires ENABLE ROW LEVEL SECURITY;
ALTER TABLE smg_entries ENABLE ROW LEVEL SECURITY;
-- RLS Policies for goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY goals_isolate ON goals
  FOR ALL USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()))
  WITH CHECK (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

-- RLS Policies for stores (only allow reading own store)
CREATE POLICY stores_isolate ON stores
  FOR ALL USING (id = (SELECT store_id FROM users WHERE id = auth.uid()));

-- RLS Policies for users (only allow reading own user record)
CREATE POLICY users_isolate ON users
  FOR ALL USING (id = auth.uid());

-- RLS Policies for omega_daily
CREATE POLICY omega_daily_isolate ON omega_daily
  FOR ALL USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()))
  WITH CHECK (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

-- RLS Policies for interviews
CREATE POLICY interviews_isolate ON interviews
  FOR ALL USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()))
  WITH CHECK (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

-- RLS Policies for hires
CREATE POLICY hires_isolate ON hires
  FOR ALL USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()))
  WITH CHECK (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

-- RLS Policies for smg_entries
CREATE POLICY smg_entries_isolate ON smg_entries
  FOR ALL USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()))
  WITH CHECK (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

-- RLS Policies for smg_monthly view
CREATE POLICY smg_monthly_isolate ON smg_monthly
  FOR SELECT USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

-- Create SMG Daily table for manual entry
CREATE TABLE smg_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  accuracy_decimal NUMERIC NOT NULL CHECK (accuracy_decimal >= 0),
  zod_per_10k NUMERIC NOT NULL CHECK (zod_per_10k >= 0),
  cc_complaints NUMERIC NOT NULL CHECK (cc_complaints >= 0),
  osat_decimal NUMERIC NOT NULL CHECK (osat_decimal >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, date)
);

-- Enable RLS for smg_daily
ALTER TABLE smg_daily ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for smg_daily
CREATE POLICY "Users can view their store's SMG data" ON smg_daily
  FOR SELECT USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert SMG data for their store" ON smg_daily
  FOR INSERT WITH CHECK (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their store's SMG data" ON smg_daily
  FOR UPDATE USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their store's SMG data" ON smg_daily
  FOR DELETE USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_omega_daily_store_date ON omega_daily(store_id, business_date);
CREATE INDEX idx_interviews_store_date ON interviews(store_id, interview_date);
CREATE INDEX idx_smg_entries_store_date ON smg_entries(store_id, entry_date);
CREATE INDEX idx_smg_daily_store_date ON smg_daily(store_id, date);
CREATE INDEX idx_hires_interview_id ON hires(interview_id);
