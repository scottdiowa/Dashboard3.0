import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Plus, Search, Calendar, Phone, Mail, MapPin, FileText, Edit, Trash2, Upload, Download, Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatTime, getStatusColor } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/interviews')({
  component: InterviewsPage,
})

// Simple interview type
interface Interview {
  id: string
  store_id: string
  candidate_name: string
  phone: string | null
  email: string | null
  position: string | null
  interview_date: string
  interview_time: string
  status: string
  notes: string | null
  created_at: string
  attachments?: InterviewAttachment[]
}

// Interview attachment type
interface InterviewAttachment {
  id: string
  interview_id: string
  store_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_by: string
  created_at: string
}

// Simple form data type
interface InterviewFormData {
  candidate_name: string
  phone: string
  email: string
  position: string
  interview_date: string
  interview_time: string
  status: string
  notes: string
}

// File upload type
interface FileUpload {
  file: File
  id: string
  progress: number
}

function InterviewsPage() {
  const [storeId, setStoreId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(false)
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Form state
  const [formData, setFormData] = useState<InterviewFormData>({
      candidate_name: '',
      phone: '',
      email: '',
      position: '',
    interview_date: '',
    interview_time: '',
      status: 'SCHEDULED',
    notes: ''
  })

  // Get user's store ID and user ID
  useEffect(() => {
    const getStoreId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        const { data } = await supabase
        .from('users')
        .select('store_id')
          .eq('id', user.id)
          .single()

        if (data?.store_id) {
          setStoreId(data.store_id)
          fetchInterviews(data.store_id)
          
          // Check database enum values for debugging
          checkDatabaseEnumValues(data.store_id)
        }
      } catch (error) {
        console.error('Error getting store ID:', error)
      }
    }

    getStoreId()
  }, [])

  // Function to migrate the database enum to match schema.sql
  const migrateDatabaseEnum = async () => {
    try {
      console.log('🔧 Starting database enum migration...')

      // Step 1: Update any existing 'DONE' values to 'COMPLETED'
      console.log('Step 1: Updating DONE to COMPLETED...')
      const { error: updateError } = await supabase
        .from('interviews')
        .update({ status: 'COMPLETED' })
        .eq('status', 'DONE')

      if (updateError) {
        console.log('Update error (may be expected if no DONE values exist):', updateError.message)
      } else {
        console.log('✅ Updated existing DONE values to COMPLETED')
      }

      // Step 2: Try to drop and recreate the enum type
      console.log('Step 2: Attempting enum recreation via RPC...')

      // This would require a custom RPC function in Supabase
      // For now, we'll provide instructions to the user

      console.log('⚠️  Manual migration required!')
      console.log('Please run this SQL in your Supabase SQL Editor:')
      console.log(`
-- Migration SQL to run in Supabase Dashboard:
DROP TYPE IF EXISTS interview_status CASCADE;
CREATE TYPE interview_status AS ENUM ('SCHEDULED','COMPLETED','NO_SHOW','HIRED','REJECTED');

-- Then recreate the interviews table if it was dropped:
-- (Copy the CREATE TABLE statement from schema.sql)
      `)

      toast({
        title: 'Migration Instructions',
        description: 'Check console for SQL commands to run in Supabase Dashboard',
        variant: 'default'
      })

    } catch (error) {
      console.error('Migration error:', error)
      toast({
        title: 'Migration Error',
        description: 'See console for details',
        variant: 'destructive'
      })
    }
  }

  // Function to check what enum values the database actually accepts
  const checkDatabaseEnumValues = async (storeId: string) => {
    try {
      console.log('🔍 Checking database enum values...')
      
      // Try to get the current enum definition
      const { data: enumData, error: enumError } = await supabase
        .rpc('get_enum_values', { enum_name: 'interview_status' })
      
      if (enumError) {
        console.log('Could not get enum values via RPC, trying direct query...')
        
        // Try to insert test records with different status values
        const testStatuses = ['SCHEDULED', 'COMPLETED', 'NO_SHOW', 'HIRED', 'REJECTED']
        
        for (const status of testStatuses) {
          try {
            console.log(`Testing status: "${status}"`)
            
            // Try to insert a test record
            const { error: insertError } = await supabase
              .from('interviews')
              .insert([{
                store_id: storeId,
                candidate_name: `TEST_${status}`,
                interview_date: new Date().toISOString().split('T')[0],
                interview_time: '12:00:00',
                status: status,
                position: 'Test Position' // Required field
              }])
              .select()
            
            if (insertError) {
              console.log(`❌ Status "${status}" rejected:`, insertError.message)
            } else {
              console.log(`✅ Status "${status}" accepted`)
              
              // Clean up test record
              await supabase
                .from('interviews')
                .delete()
                .eq('candidate_name', `TEST_${status}`)
            }
          } catch (testError) {
            console.log(`❌ Status "${status}" failed:`, testError)
          }
        }
      } else {
        console.log('✅ Database enum values:', enumData)
      }
    } catch (error) {
      console.error('Error checking database enum values:', error)
    }
  }

  // Fetch interviews
  const fetchInterviews = async (storeId: string) => {
    try {
      setIsLoading(true)
      console.log('🔍 Fetching interviews for store:', storeId)
      
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          attachments:interview_attachments(*)
        `)
        .eq('store_id', storeId)
        .order('interview_date', { ascending: true })
        .order('interview_time', { ascending: true })

      if (error) {
        console.error('❌ Error fetching interviews:', error)
        throw error
      }

      console.log('📊 Fetched interviews:', data)
      console.log('📎 Attachments found:', data?.map(i => ({ 
        interview: i.candidate_name, 
        attachments: i.attachments?.length || 0 
      })))

      setInterviews(data || [])
    } catch (error) {
      console.error('Error fetching interviews:', error)
      toast({ title: 'Error', description: 'Failed to fetch interviews', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form input changes
  const handleInputChange = (field: keyof InterviewFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      candidate_name: '',
      phone: '',
      email: '',
      position: '',
      interview_date: '',
      interview_time: '',
      status: 'SCHEDULED',
      notes: ''
    })
    setEditingInterview(null)
    setFileUploads([])
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    console.log('📁 File selection event:', files)
    
    if (!files) {
      console.log('❌ No files selected')
      return
    }

    console.log('📁 Files selected:', Array.from(files).map(f => f.name))

    const newUploads: FileUpload[] = Array.from(files).map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0
    }))

    console.log('📁 New uploads created:', newUploads.map(u => u.file.name))
    setFileUploads(prev => {
      const updated = [...prev, ...newUploads]
      console.log('📁 Total uploads now:', updated.length)
      return updated
    })
  }

  // Remove file from upload queue
  const removeFileUpload = (id: string) => {
    setFileUploads(prev => prev.filter(upload => upload.id !== id))
  }

  // Upload files to Supabase Storage
  const uploadFiles = async (interviewId: string): Promise<InterviewAttachment[]> => {
    if (!userId || !storeId) throw new Error('User or store not authenticated')

    console.log('🚀 Starting file upload process for interview:', interviewId)
    console.log('📁 Files to upload:', fileUploads.map(f => f.file.name))
    console.log('👤 User ID:', userId)
    console.log('🏪 Store ID:', storeId)

    const uploadedAttachments: InterviewAttachment[] = []

    for (const upload of fileUploads) {
      try {
        console.log(`📤 Uploading file: ${upload.file.name} (${upload.file.size} bytes)`)
        
        const filePath = `${interviewId}/${upload.file.name}`

        console.log('📂 File path:', filePath)

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('interview-attachments')
          .upload(filePath, upload.file)

        if (uploadError) {
          console.error('❌ Storage upload error:', uploadError)
          throw uploadError
        }

        console.log('✅ File uploaded to storage successfully')

        // Create database record
        const attachmentData = {
          interview_id: interviewId,
          store_id: storeId,
          file_name: upload.file.name,
          file_path: filePath,
          file_size: upload.file.size,
          file_type: upload.file.type,
          uploaded_by: userId
        }

        console.log('💾 Creating database record:', attachmentData)

        const { data: attachment, error: dbError } = await supabase
          .from('interview_attachments')
          .insert([attachmentData])
          .select()
          .single()

        if (dbError) {
          console.error('❌ Database insert error:', dbError)
          console.error('❌ Full error details:', JSON.stringify(dbError, null, 2))
          console.error('❌ Error code:', dbError.code)
          console.error('❌ Error message:', dbError.message)
          console.error('❌ Error details:', dbError.details)
          console.error('❌ Error hint:', dbError.hint)
          throw dbError
        }

        console.log('✅ Database record created:', attachment)
        uploadedAttachments.push(attachment)
      } catch (error) {
        console.error('❌ Error uploading file:', upload.file.name, error)
        throw error
      }
    }

    console.log('🎉 All files uploaded successfully!')
    console.log('📊 Upload summary:')
    console.log('  - Files processed:', fileUploads.length)
    console.log('  - Files uploaded to storage:', uploadedAttachments.length)
    console.log('  - Database records created:', uploadedAttachments.length)
    console.log('📎 Uploaded attachments:', uploadedAttachments.map(a => ({ id: a.id, file_name: a.file_name, file_path: a.file_path })))
    
    return uploadedAttachments
  }

  // Download attachment
  const downloadAttachment = async (attachment: InterviewAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('interview-attachments')
        .download(attachment.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
      toast({ title: 'Error', description: 'Failed to download file', variant: 'destructive' })
    }
  }

  // Delete attachment
  const deleteAttachment = async (attachmentId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('interview-attachments')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('interview_attachments')
        .delete()
        .eq('id', attachmentId)

      if (dbError) throw dbError

      toast({ title: 'Success', description: 'Attachment deleted successfully' })
      
      // Refresh interviews to update the UI
      if (storeId) fetchInterviews(storeId)
    } catch (error) {
      console.error('Error deleting attachment:', error)
      toast({ title: 'Error', description: 'Failed to delete attachment', variant: 'destructive' })
    }
  }

  // Preview attachment
  const previewAttachment = async (attachment: InterviewAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('interview-attachments')
        .download(attachment.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error previewing file:', error)
      toast({ title: 'Error', description: 'Failed to preview file', variant: 'destructive' })
    }
  }

  // Check if calendar_events table exists
  const checkCalendarTable = async () => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .select('id')
        .limit(1)

      if (error) {
        console.error('Calendar table error:', error)
        toast({ 
          title: 'Calendar Table Error', 
          description: `Table may not exist: ${error.message}`, 
          variant: 'destructive' 
        })
        return false
      }

      console.log('✅ Calendar table exists and is accessible')
      toast({ 
        title: 'Calendar Table OK', 
        description: 'Calendar events table is accessible', 
        variant: 'default' 
      })
      return true
    } catch (error) {
      console.error('Calendar table check error:', error)
      toast({ 
        title: 'Calendar Table Error', 
        description: 'Failed to check calendar table', 
        variant: 'destructive' 
      })
      return false
    }
  }

  // Check if storage bucket exists
  const checkStorageBucket = async () => {
    try {
      const { error } = await supabase.storage
        .from('interview-attachments')
        .list('', { limit: 1 })

      if (error) {
        console.error('Storage bucket error:', error)
        toast({ 
          title: 'Storage Bucket Error', 
          description: `Bucket may not exist: ${error.message}`, 
          variant: 'destructive' 
        })
        return false
      }

      console.log('✅ Storage bucket exists and is accessible')
      toast({ 
        title: 'Storage Bucket OK', 
        description: 'interview-attachments bucket is accessible', 
        variant: 'default' 
      })
      return true
    } catch (error) {
      console.error('Storage bucket check error:', error)
      toast({ 
        title: 'Storage Bucket Error', 
        description: 'Failed to check storage bucket', 
        variant: 'destructive' 
      })
      return false
    }
  }

  // Force refresh interviews with detailed logging
  const forceRefreshInterviews = async () => {
    if (!storeId) {
      toast({ title: 'Error', description: 'No store ID available', variant: 'destructive' })
      return
    }

    console.log('🔄 Force refreshing interviews...')
    console.log('🏪 Store ID:', storeId)
    
    try {
      setIsLoading(true)
      
      // Clear current state
      setInterviews([])
      
      // Fetch fresh data
      await fetchInterviews(storeId)
      
      console.log('✅ Force refresh completed')
      toast({ 
        title: 'Refresh Complete', 
        description: 'Interviews data refreshed from database', 
        variant: 'default' 
      })
    } catch (error) {
      console.error('❌ Force refresh error:', error)
      toast({ 
        title: 'Refresh Error', 
        description: 'Failed to refresh interviews', 
        variant: 'destructive' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Simple test to create a test attachment
  const testAttachmentUpload = async () => {
    if (!storeId || !userId) {
      toast({ title: 'Error', description: 'Store ID or User ID not available', variant: 'destructive' })
      return
    }

    try {
      console.log('🧪 Testing attachment upload...')
      
      // Create a simple test file
      const testContent = 'This is a test file for attachment upload'
      const testFile = new File([testContent], 'test-file.txt', { type: 'text/plain' })
      
      console.log('📁 Test file created:', testFile.name, testFile.size, 'bytes')
      
      // Test storage upload
      const testPath = `test-uploads/test-${Date.now()}.txt`
      console.log('📤 Uploading to storage path:', testPath)
      
      const { error: storageError } = await supabase.storage
        .from('interview-attachments')
        .upload(testPath, testFile)

      if (storageError) {
        console.error('❌ Storage upload failed:', storageError)
        toast({ 
          title: 'Storage Test Failed', 
          description: `Storage error: ${storageError.message}`, 
          variant: 'destructive' 
        })
        return
      }

      console.log('✅ Storage upload successful')

      // Get a real interview ID for testing
      const { data: realInterviews, error: interviewError } = await supabase
        .from('interviews')
        .select('id')
        .eq('store_id', storeId)
        .limit(1)

      if (interviewError || !realInterviews || realInterviews.length === 0) {
        console.error('❌ No interviews found for testing:', interviewError)
        toast({ 
          title: 'Test Failed', 
          description: 'No interviews found to test with. Create an interview first.', 
          variant: 'destructive' 
        })
        return
      }

      const testInterviewId = realInterviews[0].id
      console.log('📋 Using real interview ID for test:', testInterviewId)

      // Test database insert
      const testAttachmentData = {
        interview_id: testInterviewId,
        store_id: storeId,
        file_name: testFile.name,
        file_path: testPath,
        file_size: testFile.size,
        file_type: testFile.type,
        uploaded_by: userId
      }

      console.log('💾 Testing database insert:', testAttachmentData)

      const { data: attachment, error: dbError } = await supabase
        .from('interview_attachments')
        .insert([testAttachmentData])
        .select()
        .single()

      if (dbError) {
        console.error('❌ Database insert failed:', dbError)
        toast({ 
          title: 'Database Test Failed', 
          description: `Database error: ${dbError.message}`, 
          variant: 'destructive' 
        })
        return
      }

      console.log('✅ Database insert successful:', attachment)

      // Clean up test data
      await supabase.storage
        .from('interview-attachments')
        .remove([testPath])

      await supabase
        .from('interview_attachments')
        .delete()
        .eq('id', attachment.id)

      console.log('🧹 Test data cleaned up')

      toast({ 
        title: 'Test Successful!', 
        description: 'Both storage and database are working correctly', 
        variant: 'default' 
      })

    } catch (error) {
      console.error('❌ Test failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast({ 
        title: 'Test Failed', 
        description: `Test error: ${errorMessage}`, 
        variant: 'destructive' 
      })
    }
  }

  // Debug function to check attachments
  const debugAttachments = async () => {
    if (!storeId) {
      toast({ title: 'Error', description: 'No store ID available', variant: 'destructive' })
      return
    }

    try {
      console.log('🔍 === COMPREHENSIVE ATTACHMENT DEBUG ===')
      console.log('🏪 Store ID:', storeId)
      console.log('👤 User ID:', userId)
      
      // Check if interview_attachments table exists
      console.log('📋 Checking interview_attachments table...')
      const { error: tableError } = await supabase
        .from('interview_attachments')
        .select('id')
        .limit(1)

      if (tableError) {
        console.error('❌ Table check failed:', tableError)
        toast({ 
          title: 'Table Missing', 
          description: `interview_attachments table may not exist: ${tableError.message}`, 
          variant: 'destructive' 
        })
        return
      }
      console.log('✅ interview_attachments table exists')
      
      // Check database records
      console.log('📊 Checking database records...')
      const { data: dbAttachments, error: dbError } = await supabase
        .from('interview_attachments')
        .select('*')
        .eq('store_id', storeId)

      if (dbError) {
        console.error('❌ Database query error:', dbError)
        toast({ title: 'Database Error', description: dbError.message, variant: 'destructive' })
        return
      }

      console.log('📊 Database attachments found:', dbAttachments?.length || 0)
      console.log('📊 Database records:', dbAttachments)

      // Check storage bucket
      console.log('📁 Checking storage bucket...')
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('interview-attachments')
        .list('', { limit: 100 })

      if (storageError) {
        console.error('❌ Storage error:', storageError)
        toast({ title: 'Storage Error', description: storageError.message, variant: 'destructive' })
        return
      }

      console.log('📁 Storage files found:', storageFiles?.length || 0)
      console.log('📁 Storage files:', storageFiles)

      // Check current interviews data
      console.log('📋 Checking current interviews data...')
      console.log('📋 Current interviews state:', interviews)
      console.log('📋 Interviews with attachments:', interviews.filter(i => i.attachments && i.attachments.length > 0))

      // Check for mismatches
      const dbFilePaths = dbAttachments?.map(a => a.file_path) || []
      const storageFilePaths = storageFiles?.map(f => f.name) || []

      console.log('🔗 Database file paths:', dbFilePaths)
      console.log('🔗 Storage file paths:', storageFilePaths)

      const missingInStorage = dbFilePaths.filter(path => !storageFilePaths.includes(path))
      const missingInDb = storageFilePaths.filter(path => !dbFilePaths.includes(path))

      if (missingInStorage.length > 0) {
        console.warn('⚠️ Files in database but missing in storage:', missingInStorage)
      }
      if (missingInDb.length > 0) {
        console.warn('⚠️ Files in storage but missing in database:', missingInDb)
      }

      // Summary
      const summary = {
        tableExists: true,
        dbRecords: dbAttachments?.length || 0,
        storageFiles: storageFiles?.length || 0,
        interviewsWithAttachments: interviews.filter(i => i.attachments && i.attachments.length > 0).length,
        missingInStorage: missingInStorage.length,
        missingInDb: missingInDb.length
      }

      console.log('📊 === DEBUG SUMMARY ===')
      console.log('📊 Table exists:', summary.tableExists)
      console.log('📊 Database records:', summary.dbRecords)
      console.log('📊 Storage files:', summary.storageFiles)
      console.log('📊 Interviews with attachments:', summary.interviewsWithAttachments)
      console.log('📊 Missing in storage:', summary.missingInStorage)
      console.log('📊 Missing in database:', summary.missingInDb)

      toast({ 
        title: 'Debug Complete', 
        description: `DB: ${summary.dbRecords}, Storage: ${summary.storageFiles}, UI: ${summary.interviewsWithAttachments}`,
        variant: 'default'
      })

    } catch (error) {
      console.error('❌ Debug error:', error)
      toast({ title: 'Debug Error', description: 'Check console for details', variant: 'destructive' })
    }
  }

  // Find existing calendar event for interview
  const findCalendarEvent = async (interviewId: string) => {
    if (!userId) return null

    try {
      // First check if calendar_events table exists
      const { data, error } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('created_by', userId)
        .ilike('title', `Interview: %`)
        .ilike('description', `%interviewId: ${interviewId}%`)
        .limit(1)

      if (error) {
        console.warn('Calendar table may not exist or has permission issues:', error.message)
        return null
      }

      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.warn('Calendar functionality disabled due to error:', error)
      return null
    }
  }

  // Delete calendar event for interview
  const deleteCalendarEvent = async (interviewId: string) => {
    if (!userId) {
      console.warn('No user ID available for calendar event deletion')
      return
    }

    try {
      // Check if calendar table exists first
      const { error: tableCheckError } = await supabase
        .from('calendar_events')
        .select('id')
        .limit(1)

      if (tableCheckError) {
        console.warn('Calendar table not available, skipping calendar event deletion:', tableCheckError.message)
        return
      }

      // Find existing calendar event
      const existingEvent = await findCalendarEvent(interviewId)

      if (existingEvent) {
        // Delete the calendar event
        const { error } = await supabase
          .from('calendar_events')
          .delete()
          .eq('id', existingEvent.id)

        if (error) {
          console.warn('Error deleting calendar event:', error)
          return
        } else {
          console.log('Calendar event deleted successfully for interview:', interviewId)
          // Force immediate refetch of calendar events to refresh the calendar UI
          queryClient.invalidateQueries({ queryKey: ['calendar-events', userId] })
          queryClient.refetchQueries({ queryKey: ['calendar-events', userId] })
        }
      } else {
        console.log('No calendar event found to delete for interview:', interviewId)
      }
    } catch (error) {
      console.warn('Calendar deletion disabled due to error:', error)
    }
  }

  // Create or update calendar event for interview (only for SCHEDULED status)
  const createOrUpdateCalendarEvent = async (interview: Interview, isUpdate: boolean = false) => {
    if (!userId) {
      console.warn('No user ID available for calendar event creation')
      return
    }

    try {
      // Check if calendar table exists first
      const { error: tableCheckError } = await supabase
        .from('calendar_events')
        .select('id')
        .limit(1)

      if (tableCheckError) {
        console.warn('Calendar table not available, skipping calendar event creation:', tableCheckError.message)
        return
      }

      // Only create/update calendar events for SCHEDULED interviews
      if (interview.status !== 'SCHEDULED') {
        console.log('Interview status is not SCHEDULED, removing calendar event if it exists')
        // Delete existing calendar event if status is not SCHEDULED
        await deleteCalendarEvent(interview.id)
        return
      }

      // Validate date and time inputs
      if (!interview.interview_date || !interview.interview_time) {
        console.warn('Invalid date or time for calendar event:', {
          date: interview.interview_date,
          time: interview.interview_time
        })
        return
      }

      // Format time to include seconds for proper ISO datetime
      const formattedTimeForCalendar = interview.interview_time.includes(':') && interview.interview_time.split(':').length === 2
        ? `${interview.interview_time}:00`
        : interview.interview_time

      // Combine date and time for start_date (ensure proper format)
      const startDateTime = `${interview.interview_date}T${formattedTimeForCalendar}`

      // Create start date and validate it's valid
      const startDate = new Date(startDateTime)
      if (isNaN(startDate.getTime())) {
        console.error('Invalid start date created:', startDateTime, 'from:', {
          date: interview.interview_date,
          time: interview.interview_time,
          formattedTime: formattedTimeForCalendar
        })
        throw new Error('Invalid interview date/time format')
      }

      // Calculate end time (assume 1 hour duration)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // Add 1 hour
      if (isNaN(endDate.getTime())) {
        console.error('Invalid end date calculated from start date:', startDate)
        throw new Error('Invalid end date calculation')
      }

      const endDateTime = endDate.toISOString()

      const eventData = {
        title: `Interview: ${interview.candidate_name}`,
        description: `Interview for ${interview.position || 'position'}\n${interview.notes || ''}\nPhone: ${interview.phone || 'N/A'}\nEmail: ${interview.email || 'N/A'}\ninterviewId: ${interview.id}`,
        start_date: startDateTime,
        end_date: endDateTime,
        all_day: false,
        location: 'Store Interview Room',
        reminder_type: '15min',
        updated_at: new Date().toISOString()
      }

      if (isUpdate) {
        // Find existing calendar event
        const existingEvent = await findCalendarEvent(interview.id)

        if (existingEvent) {
          // Update existing calendar event
          const { error } = await supabase
            .from('calendar_events')
            .update(eventData)
            .eq('id', existingEvent.id)

          if (error) {
            console.error('Error updating calendar event:', error)
          } else {
            console.log('Calendar event updated successfully for interview:', interview.id)
            // Force immediate refetch of calendar events to refresh the calendar UI
            queryClient.invalidateQueries({ queryKey: ['calendar-events', userId] })
            queryClient.refetchQueries({ queryKey: ['calendar-events', userId] })
          }
        } else {
          // Create new calendar event if none exists
        const { error } = await supabase
            .from('calendar_events')
            .insert([{ ...eventData, created_by: userId }])

          if (error) {
            console.error('Error creating calendar event:', error)
          } else {
            console.log('Calendar event created successfully for interview:', interview.id)
            // Force immediate refetch of calendar events to refresh the calendar UI
            queryClient.invalidateQueries({ queryKey: ['calendar-events', userId] })
            queryClient.refetchQueries({ queryKey: ['calendar-events', userId] })
          }
        }
      } else {
        // Create new calendar event
        const { error } = await supabase
          .from('calendar_events')
          .insert([{ ...eventData, created_by: userId }])

        if (error) {
          console.error('Error creating calendar event:', error)
          toast({
            title: 'Warning',
            description: 'Interview scheduled but calendar event creation failed.',
            variant: 'destructive'
          })
        } else {
          console.log('Calendar event created successfully for interview:', interview.id)
          // Force immediate refetch of calendar events to refresh the calendar UI
          queryClient.invalidateQueries({ queryKey: ['calendar-events', userId] })
          queryClient.refetchQueries({ queryKey: ['calendar-events', userId] })
        }
      }
    } catch (error) {
      console.error('Error in createOrUpdateCalendarEvent:', error)
      // Re-throw the error so it can be caught by the calling function
      throw error
    }
  }

  // Save interview (create or update)
  const saveInterview = async () => {
    if (!userId) {
      toast({ title: 'Error', description: 'User not authenticated', variant: 'destructive' })
      return
    }

    if (!storeId) {
      toast({ title: 'Error', description: 'No store selected', variant: 'destructive' })
      return
    }

    // Validate required fields
    if (!formData.candidate_name.trim()) {
      toast({ title: 'Error', description: 'Candidate name is required', variant: 'destructive' })
      return
    }

    if (!formData.position.trim()) {
      toast({ title: 'Error', description: 'Position is required', variant: 'destructive' })
      return
    }

    if (!formData.interview_date) {
      toast({ title: 'Error', description: 'Interview date is required', variant: 'destructive' })
        return
      }

    if (!formData.interview_time) {
      toast({ title: 'Error', description: 'Interview time is required', variant: 'destructive' })
      return
    }

    console.log('Saving interview with data:', formData)
    console.log('Interview date format:', typeof formData.interview_date, formData.interview_date)
    console.log('Interview time format:', typeof formData.interview_time, formData.interview_time)

    // Format time to include seconds for PostgreSQL compatibility
    const formattedTime = formData.interview_time.includes(':') && formData.interview_time.split(':').length === 2
      ? `${formData.interview_time}:00`
      : formData.interview_time

    console.log('Formatted time for database:', formattedTime)

    try {
      if (editingInterview) {
        // Update existing interview
        const { data: updatedInterview, error } = await supabase
          .from('interviews')
          .update({
            candidate_name: formData.candidate_name,
            phone: formData.phone || null,
            email: formData.email || null,
            position: formData.position,
            interview_date: formData.interview_date,
            interview_time: formattedTime,
            status: formData.status,
            notes: formData.notes || null
          })
          .eq('id', editingInterview.id)
          .select()
          .single()

        if (error) throw error

        // Update calendar event for the modified interview (don't block on failure)
        if (updatedInterview) {
          try {
            await createOrUpdateCalendarEvent(updatedInterview, true)
          } catch (calendarError) {
            console.warn('Calendar event update failed, but interview was saved:', calendarError)
            // Don't show error toast here since interview was successfully saved
          }
        }

        toast({ title: 'Success!', description: formData.status === 'SCHEDULED' ? 'Interview updated and calendar synced!' : 'Interview updated and removed from calendar!' })
      } else {
        // Create new interview
        const { data: newInterview, error } = await supabase
          .from('interviews')
          .insert([{
            store_id: storeId,
            candidate_name: formData.candidate_name,
            phone: formData.phone || null,
            email: formData.email || null,
            position: formData.position,
            interview_date: formData.interview_date,
            interview_time: formattedTime,
            status: formData.status,
            notes: formData.notes || null
          }])
          .select()
          .single()

      if (error) throw error

        // Create calendar event for the new interview (don't block on failure)
        if (newInterview) {
          try {
            await createOrUpdateCalendarEvent(newInterview, false)
          } catch (calendarError) {
            console.warn('Calendar event creation failed, but interview was saved:', calendarError)
            // Don't show error toast here since interview was successfully saved
          }

          // Upload files if any
          console.log('📤 Checking for files to upload:', fileUploads.length, 'files')
          if (fileUploads.length > 0) {
            console.log('📤 Starting file upload process...')
            console.log('📤 Files to upload:', fileUploads.map(f => f.file.name))
            try {
              setIsUploading(true)
              await uploadFiles(newInterview.id)
              setFileUploads([])
              console.log('✅ File upload completed successfully')
              
              // Refresh interviews to show the new attachments
              console.log('🔄 Refreshing interviews to show attachments...')
              await fetchInterviews(storeId)
            } catch (uploadError) {
              console.error('❌ File upload failed:', uploadError)
              toast({ 
                title: 'Warning', 
                description: 'Interview saved but some files failed to upload. You can try uploading them again by editing the interview.',
                variant: 'destructive' 
              })
            } finally {
              setIsUploading(false)
            }
          } else {
            console.log('ℹ️ No files to upload - fileUploads array is empty')
          }
        }

        toast({ title: 'Success!', description: formData.status === 'SCHEDULED' ? 'Interview scheduled and added to calendar!' : 'Interview saved successfully!' })
      }

      // Refresh data and close form
      fetchInterviews(storeId)
      setIsAddDrawerOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('Error saving interview:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      console.error('Error code:', error.code)

      let errorMessage = 'Failed to save interview'
      if (error.message) {
        errorMessage = error.message
      } else if (error.details) {
        errorMessage = `Database error: ${error.details}`
      } else if (error.hint) {
        errorMessage = `Hint: ${error.hint}`
      } else if (error.code) {
        errorMessage = `Error code: ${error.code}`
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  // Edit interview
  const handleEdit = (interview: Interview) => {
    setEditingInterview(interview)
    setFormData({
      candidate_name: interview.candidate_name,
      phone: interview.phone || '',
      email: interview.email || '',
      position: interview.position || '',
      interview_date: interview.interview_date,
      interview_time: interview.interview_time,
      status: interview.status,
      notes: interview.notes || ''
    })
    setIsAddDrawerOpen(true)
  }

  // Delete interview
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this interview?')) return

    try {
      // Delete the calendar event first (don't block on failure)
      try {
        await deleteCalendarEvent(id)
      } catch (calendarError) {
        console.warn('Calendar event deletion failed, but continuing with interview deletion:', calendarError)
      }

      // Delete the interview from database
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast({ title: 'Deleted!', description: 'Interview and calendar event removed successfully.' })
      fetchInterviews(storeId!)
    } catch (error: any) {
      console.error('Error deleting interview:', error)
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to delete interview', 
        variant: 'destructive' 
      })
    }
  }

  // Filter interviews
  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = interview.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (interview.position || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'ALL' || interview.status === statusFilter
      return matchesSearch && matchesStatus
    })

  // Group interviews by date
  const groupedInterviews = filteredInterviews.reduce((groups: Record<string, Interview[]>, interview) => {
      const date = interview.interview_date
      if (!groups[date]) groups[date] = []
      groups[date].push(interview)
      return groups
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wendys-charcoal">Interviews & New Hires</h1>
          <p className="text-gray-600">
            Manage candidate interviews and track the hiring process
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => storeId && fetchInterviews(storeId)} 
            variant="outline"
            className="text-sm"
          >
            Refresh
          </Button>
          <Button onClick={() => setIsAddDrawerOpen(true)} className="wendys-button">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="NO_SHOW">No Show</SelectItem>
            <SelectItem value="HIRED">Hired</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Interviews List */}
      <div className="space-y-6">
        {isLoading && (
          <div className="text-center text-gray-500">Loading interviews...</div>
        )}
        {!isLoading && Object.keys(groupedInterviews).length === 0 && (
          <div className="text-center text-gray-500">No interviews found.</div>
        )}
        {Object.entries(groupedInterviews).map(([date, interviews]) => (
          <div key={date} className="wendys-card">
            <h3 className="text-lg font-semibold text-wendys-charcoal mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {formatDate(date)}
            </h3>
            <div className="space-y-3">
              {interviews.map((interview) => (
                <div
                  key={interview.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-wendys-charcoal">{interview.candidate_name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                          {interview.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{interview.position || 'No position specified'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatTime(interview.interview_time)}</span>
                        </div>
                        {interview.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{interview.phone}</span>
                          </div>
                        )}
                        {interview.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{interview.email}</span>
                          </div>
                        )}
                      </div>
                      {interview.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4 inline mr-1" />
                          {interview.notes}
                        </div>
                      )}
                      
                      {/* Attachments */}
                      {interview.attachments && interview.attachments.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Attachments:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {interview.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
                              >
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-700 truncate max-w-32">
                                  {attachment.file_name}
                                </span>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => previewAttachment(attachment)}
                                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                                    title="Preview"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadAttachment(attachment)}
                                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                    title="Download"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteAttachment(attachment.id, attachment.file_path)}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(interview)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(interview.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Interview Drawer */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-wendys-charcoal">
                {editingInterview ? 'Edit Interview' : 'Schedule New Interview'}
              </h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddDrawerOpen(false)
                  resetForm()
                }}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); saveInterview(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="candidate_name">Candidate Name *</Label>
                  <Input
                    id="candidate_name"
                    value={formData.candidate_name}
                    onChange={(e) => handleInputChange('candidate_name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="e.g., Crew Member, Manager"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="candidate@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interview_date">Interview Date *</Label>
                  <Input
                    id="interview_date"
                    type="date"
                    value={formData.interview_date}
                    onChange={(e) => handleInputChange('interview_date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interview_time">Interview Time *</Label>
                  <Input
                    id="interview_time"
                    type="time"
                    value={formData.interview_time}
                    onChange={(e) => handleInputChange('interview_time', e.target.value)}
                    required
                  />
                </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                  >
                  <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="NO_SHOW">No Show</SelectItem>
                      <SelectItem value="HIRED">Hired</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes about the candidate..."
                  rows={3}
                />
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                  />
                  <label
                    htmlFor="attachments"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload files or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      PDF, DOC, DOCX, TXT, JPG, PNG, GIF (Max 10MB each)
                    </span>
                  </label>
                </div>

                {/* File Upload Queue */}
                {fileUploads.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Files to upload:</h4>
                    {fileUploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{upload.file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(upload.file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFileUpload(upload.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Uploading indicator */}
                {isUploading && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Uploading files...</span>
                  </div>
                )}
              </div>

                            <div className="flex justify-between items-center pt-4">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => checkDatabaseEnumValues(storeId!)}
                    className="text-xs"
                  >
                    Test Enum
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={migrateDatabaseEnum}
                    className="text-xs"
                  >
                    Migrate DB
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={debugAttachments}
                    className="text-xs"
                  >
                    Debug Attachments
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={checkCalendarTable}
                    className="text-xs"
                  >
                    Check Calendar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={checkStorageBucket}
                    className="text-xs"
                  >
                    Check Storage
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={forceRefreshInterviews}
                    className="text-xs"
                  >
                    Force Refresh
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testAttachmentUpload}
                    className="text-xs"
                  >
                    Test Upload
                  </Button>
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDrawerOpen(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="wendys-button">
                    {editingInterview ? 'Update Interview' : 'Schedule Interview'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
