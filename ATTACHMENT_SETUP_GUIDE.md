# Interview Attachments Setup Guide

## Quick Setup Checklist

### 1. Database Setup
Run this SQL in your Supabase SQL Editor:

```sql
-- Create interview_attachments table
CREATE TABLE interview_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create unique index
CREATE UNIQUE INDEX ON interview_attachments (interview_id, file_name);

-- Enable RLS
ALTER TABLE interview_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view attachments for their store's interviews" ON interview_attachments
  FOR SELECT USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert attachments for their store's interviews" ON interview_attachments
  FOR INSERT WITH CHECK (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update attachments for their store's interviews" ON interview_attachments
  FOR UPDATE USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete attachments for their store's interviews" ON interview_attachments
  FOR DELETE USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

-- Create indexes
CREATE INDEX idx_interview_attachments_interview_id ON interview_attachments(interview_id);
CREATE INDEX idx_interview_attachments_store_id ON interview_attachments(store_id);
```

### 2. Storage Setup
1. Go to Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Name: `interview-attachments`
4. Set to **Public** (or configure RLS policies)
5. Click "Create bucket"

### 3. Test the Setup
1. Go to your interview tab
2. Click "Schedule Interview"
3. Click "Test Upload" button
4. Check console for results

## Troubleshooting

### If "Test Upload" fails:

**Storage Error:**
- Bucket doesn't exist → Create the bucket
- Permission error → Check bucket permissions
- Network error → Check internet connection

**Database Error:**
- Table doesn't exist → Run the SQL script
- Permission error → Check RLS policies
- Foreign key error → Check if interviews table exists

### If "Test Upload" succeeds but real uploads don't work:

**Check the console logs:**
1. Upload a real file
2. Watch console for detailed logs
3. Look for any error messages
4. Compare with test upload logs

### Common Issues:

1. **Missing Storage Bucket**
   - Error: "Bucket not found"
   - Solution: Create `interview-attachments` bucket

2. **Missing Database Table**
   - Error: "relation does not exist"
   - Solution: Run the SQL script

3. **Permission Issues**
   - Error: "permission denied"
   - Solution: Check RLS policies

4. **File Size Limits**
   - Error: "file too large"
   - Solution: Check Supabase storage limits

5. **File Type Restrictions**
   - Error: "invalid file type"
   - Solution: Check accepted file types in code

## Debug Steps

1. **Run "Test Upload"** - Tests basic functionality
2. **Run "Debug Attachments"** - Shows current state
3. **Run "Check Storage"** - Verifies storage access
4. **Run "Force Refresh"** - Clears cache and reloads

## Expected Results

After setup, you should see:
- ✅ Test Upload: "Test Successful!"
- ✅ Check Storage: "Storage Bucket OK"
- ✅ Debug Attachments: Shows current data
- ✅ File uploads work and display in interview cards
