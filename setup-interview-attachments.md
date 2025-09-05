# Interview Attachments Setup

## Database Setup

1. Run the SQL script in your Supabase SQL Editor:

```sql
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
```

## Storage Setup

2. Create a new storage bucket in Supabase:

- Go to Storage in your Supabase dashboard
- Create a new bucket named `interview-attachments`
- Set it to public if you want direct access to files
- Or keep it private and use signed URLs (recommended for security)

## Features Added

### Upload Attachments
- Drag and drop or click to upload files
- Support for PDF, DOC, DOCX, TXT, JPG, PNG, GIF files
- File size limit: 10MB per file
- Multiple file upload support

### View Attachments
- Attachments are displayed in interview cards
- File name, size, and type information shown
- Quick preview, download, and delete actions

### File Management
- Preview files in new browser tab
- Download files directly
- Delete attachments with confirmation
- Files are organized by interview ID in storage

### Security
- Row Level Security (RLS) policies ensure users can only access their store's attachments
- File uploads are validated for type and size
- Secure file paths prevent unauthorized access

## Usage

1. When creating or editing an interview, use the "Attachments" section to upload files
2. Files will be automatically uploaded when you save the interview
3. View attachments directly in the interview list
4. Use the action buttons to preview, download, or delete files

## Notes

- Files are stored in Supabase Storage under the path: `interview-attachments/{interview_id}/{filename}`
- Database records track file metadata and maintain referential integrity
- Attachments are automatically deleted when an interview is deleted
- The system handles upload failures gracefully and shows appropriate error messages
