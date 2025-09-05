-- Create interview_attachments table
CREATE TABLE interview_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL, -- Supabase Storage path
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create unique index on interview_id and file_name to prevent duplicates
CREATE UNIQUE INDEX ON interview_attachments (interview_id, file_name);

-- Enable RLS for interview_attachments
ALTER TABLE interview_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interview_attachments
CREATE POLICY "Users can view attachments for their store's interviews" ON interview_attachments
  FOR SELECT USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert attachments for their store's interviews" ON interview_attachments
  FOR INSERT WITH CHECK (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update attachments for their store's interviews" ON interview_attachments
  FOR UPDATE USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete attachments for their store's interviews" ON interview_attachments
  FOR DELETE USING (store_id = (SELECT store_id FROM users WHERE id = auth.uid()));

-- Create index for better performance
CREATE INDEX idx_interview_attachments_interview_id ON interview_attachments(interview_id);
CREATE INDEX idx_interview_attachments_store_id ON interview_attachments(store_id);
