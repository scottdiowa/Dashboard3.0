-- Seed data for Wendy's GM Dashboard
-- This creates a test store, user, and sample data

-- Insert SE 14th store
INSERT INTO stores (id, name) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'SE 14th');

-- Insert test GM user (password: test123)
-- Note: You'll need to create this user in Supabase Auth first, then update the ID here
INSERT INTO users (id, store_id, role) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'gm');

-- Insert sample Omega Daily data (last 35 days for better testing)
INSERT INTO omega_daily (store_id, business_date, net_sales, last_year_sales, labor_hours, ideal_labor_hours, labor_percentage, food_variance_cost, waste_amount, breakfast_sales, night_sales) VALUES
-- Today and recent days
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE, 12500.00, 11800.00, 85.5, 82.0, 6.8, 125.00, 87.50, 3200.00, 9300.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '1 day', 11800.00, 11200.00, 82.0, 78.5, 6.9, 118.00, 82.60, 2950.00, 8850.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '2 days', 13200.00, 12500.00, 88.0, 85.0, 6.7, 132.00, 92.40, 3300.00, 9900.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '3 days', 11500.00, 10800.00, 79.5, 76.0, 6.9, 115.00, 80.50, 2875.00, 8625.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '4 days', 12800.00, 12100.00, 86.0, 83.0, 6.7, 128.00, 89.60, 3200.00, 9600.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '5 days', 12100.00, 11400.00, 81.5, 78.0, 6.7, 121.00, 84.70, 3025.00, 9075.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '6 days', 13500.00, 12800.00, 90.0, 87.0, 6.7, 135.00, 94.50, 3375.00, 10125.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '7 days', 11200.00, 10500.00, 75.5, 72.0, 6.7, 112.00, 78.40, 2800.00, 8400.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '8 days', 12900.00, 12200.00, 86.5, 83.5, 6.7, 129.00, 90.30, 3225.00, 9675.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '9 days', 11600.00, 10900.00, 78.0, 74.5, 6.7, 116.00, 81.20, 2900.00, 8700.00),
-- Additional days (10-34) for 30+ day testing
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '10 days', 12300.00, 11600.00, 83.0, 80.0, 6.7, 123.00, 86.10, 3075.00, 9225.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '11 days', 11900.00, 11300.00, 81.0, 77.5, 6.8, 119.00, 83.30, 2975.00, 8925.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '12 days', 13100.00, 12400.00, 87.5, 84.5, 6.7, 131.00, 91.70, 3275.00, 9825.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '13 days', 11700.00, 11000.00, 79.0, 75.5, 6.8, 117.00, 81.90, 2925.00, 8775.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '14 days', 12600.00, 11900.00, 84.5, 81.5, 6.7, 126.00, 88.20, 3150.00, 9450.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '15 days', 12000.00, 11300.00, 80.5, 77.0, 6.7, 120.00, 84.00, 3000.00, 9000.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '16 days', 13400.00, 12700.00, 89.5, 86.5, 6.7, 134.00, 93.80, 3350.00, 10050.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '17 days', 11400.00, 10700.00, 76.5, 73.0, 6.7, 114.00, 79.80, 2850.00, 8550.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '18 days', 12700.00, 12000.00, 85.0, 82.0, 6.7, 127.00, 88.90, 3175.00, 9525.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '19 days', 11800.00, 11100.00, 79.5, 76.0, 6.7, 118.00, 82.60, 2950.00, 8850.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '20 days', 13000.00, 12300.00, 87.0, 84.0, 6.7, 130.00, 91.00, 3250.00, 9750.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '21 days', 11600.00, 10900.00, 78.0, 74.5, 6.7, 116.00, 81.20, 2900.00, 8700.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '22 days', 12400.00, 11700.00, 83.5, 80.5, 6.7, 124.00, 86.80, 3100.00, 9300.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '23 days', 12200.00, 11500.00, 82.0, 78.5, 6.7, 122.00, 85.40, 3050.00, 9150.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '24 days', 13300.00, 12600.00, 88.5, 85.5, 6.7, 133.00, 93.10, 3325.00, 9975.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '25 days', 11300.00, 10600.00, 76.0, 72.5, 6.7, 113.00, 79.10, 2825.00, 8475.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '26 days', 12800.00, 12100.00, 86.0, 83.0, 6.7, 128.00, 89.60, 3200.00, 9600.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '27 days', 11900.00, 11200.00, 80.0, 76.5, 6.7, 119.00, 83.30, 2975.00, 8925.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '28 days', 13200.00, 12500.00, 88.0, 85.0, 6.7, 132.00, 92.40, 3300.00, 9900.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '29 days', 11500.00, 10800.00, 77.5, 74.0, 6.7, 115.00, 80.50, 2875.00, 8625.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '30 days', 12700.00, 12000.00, 85.5, 82.5, 6.7, 127.00, 88.90, 3175.00, 9525.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '31 days', 11700.00, 11000.00, 78.5, 75.0, 6.7, 117.00, 81.90, 2925.00, 8775.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '32 days', 12500.00, 11800.00, 84.0, 81.0, 6.7, 125.00, 87.50, 3125.00, 9375.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '33 days', 12100.00, 11400.00, 81.0, 77.5, 6.7, 121.00, 84.70, 3025.00, 9075.00),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '34 days', 13000.00, 12300.00, 87.0, 84.0, 6.7, 130.00, 91.00, 3250.00, 9750.00);

-- Insert sample interviews
INSERT INTO interviews (store_id, candidate_name, phone, email, position, interview_date, interview_time, status, notes) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'John Smith', '555-0101', 'john.smith@email.com', 'Crew Member', CURRENT_DATE + INTERVAL '1 day', '14:00:00', 'SCHEDULED', 'Experienced in food service'),
('550e8400-e29b-41d4-a716-446655440000', 'Sarah Johnson', '555-0102', 'sarah.j@email.com', 'Shift Leader', CURRENT_DATE, '10:00:00', 'DONE', 'Great communication skills, recommended for hire'),
('550e8400-e29b-41d4-a716-446655440000', 'Mike Davis', '555-0103', 'mike.d@email.com', 'Crew Member', CURRENT_DATE - INTERVAL '1 day', '15:30:00', 'NO_SHOW', 'No call, no show'),
('550e8400-e29b-41d4-a716-446655440000', 'Lisa Wilson', '555-0104', 'lisa.w@email.com', 'Crew Member', CURRENT_DATE - INTERVAL '2 days', '11:00:00', 'HIRED', 'Excellent candidate, starting next week'),
('550e8400-e29b-41d4-a716-446655440000', 'Tom Brown', '555-0105', 'tom.b@email.com', 'Crew Member', CURRENT_DATE - INTERVAL '3 days', '16:00:00', 'REJECTED', 'Not a good fit for the team');

-- Insert sample hire for Lisa Wilson
INSERT INTO hires (store_id, interview_id, documents_received, onboarding_sent_date, onboarding_completed_date, manager_reviewed_date, entered_in_system_date, fingerprint_scheduled_date, first_day, notes) VALUES
('550e8400-e29b-41d4-a716-446655440000', 
 (SELECT id FROM interviews WHERE candidate_name = 'Lisa Wilson'), 
 true, 
 CURRENT_DATE - INTERVAL '1 day', 
 CURRENT_DATE, 
 CURRENT_DATE, 
 CURRENT_DATE, 
 CURRENT_DATE + INTERVAL '3 days', 
 CURRENT_DATE + INTERVAL '7 days', 
 'Lisa is very organized and completed all requirements quickly');

-- Insert sample SMG entries (last 30 days)
INSERT INTO smg_entries (store_id, entry_date, accuracy_of_order, zone_of_defection, customer_computers, taste_of_food, osat) VALUES
-- Recent days
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE, 4.8, 1.2, 4.6, 4.7, 4.6),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '1 day', 4.7, 1.3, 4.5, 4.6, 4.5),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '2 days', 4.9, 1.1, 4.7, 4.8, 4.7),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '3 days', 4.6, 1.4, 4.4, 4.5, 4.4),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '4 days', 4.8, 1.2, 4.6, 4.7, 4.6),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '5 days', 4.7, 1.3, 4.5, 4.6, 4.5),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '6 days', 4.9, 1.0, 4.8, 4.9, 4.8),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '7 days', 4.5, 1.5, 4.3, 4.4, 4.3),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '8 days', 4.8, 1.2, 4.6, 4.7, 4.6),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '9 days', 4.7, 1.3, 4.5, 4.6, 4.5),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '10 days', 4.9, 1.1, 4.7, 4.8, 4.7),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '11 days', 4.6, 1.4, 4.4, 4.5, 4.4),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '12 days', 4.8, 1.2, 4.6, 4.7, 4.6),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '13 days', 4.7, 1.3, 4.5, 4.6, 4.5),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '14 days', 4.9, 1.0, 4.8, 4.9, 4.8),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '15 days', 4.5, 1.5, 4.3, 4.4, 4.3),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '16 days', 4.8, 1.2, 4.6, 4.7, 4.6),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '17 days', 4.7, 1.3, 4.5, 4.6, 4.5),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '18 days', 4.9, 1.1, 4.7, 4.8, 4.7),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '19 days', 4.6, 1.4, 4.4, 4.5, 4.4),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '20 days', 4.8, 1.2, 4.6, 4.7, 4.6),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '21 days', 4.7, 1.3, 4.5, 4.6, 4.5),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '22 days', 4.9, 1.0, 4.8, 4.9, 4.8),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '23 days', 4.5, 1.5, 4.3, 4.4, 4.3),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '24 days', 4.8, 1.2, 4.6, 4.7, 4.6),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '25 days', 4.7, 1.3, 4.5, 4.6, 4.5),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '26 days', 4.9, 1.1, 4.7, 4.8, 4.7),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '27 days', 4.6, 1.4, 4.4, 4.5, 4.4),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '28 days', 4.8, 1.2, 4.6, 4.7, 4.6),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '29 days', 4.7, 1.3, 4.5, 4.6, 4.5);

-- Add sample SMG daily data
INSERT INTO smg_daily (store_id, date, accuracy_decimal, zod_per_10k, cc_complaints, osat_decimal, notes) VALUES
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '1 day', 0.87, 2.50, 1.25, 0.92, 'Good day overall, slight accuracy issues during lunch rush'),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '2 days', 0.91, 1.80, 0.95, 0.94, 'Improvement in accuracy, training paying off'),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '3 days', 0.89, 3.20, 2.10, 0.88, 'Busy Friday, some service delays during dinner'),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '4 days', 0.93, 1.50, 0.80, 0.96, 'Excellent performance, team working well together'),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '5 days', 0.85, 4.10, 1.75, 0.90, 'Weekend rush, need to focus on order accuracy'),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '6 days', 0.88, 2.80, 1.45, 0.91, 'Steady performance throughout the day'),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '7 days', 0.92, 1.90, 1.05, 0.95, 'Great week start, team motivated'),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '8 days', 0.86, 3.50, 1.85, 0.89, 'Some challenges during shift change'),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '9 days', 0.90, 2.20, 1.15, 0.93, 'Solid performance across all metrics'),
('550e8400-e29b-41d4-a716-446655440000', CURRENT_DATE - INTERVAL '10 days', 0.94, 1.40, 0.75, 0.97, 'Outstanding day, new training methods working');