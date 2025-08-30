import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Plus, Search, Calendar, Phone, Mail, MapPin, FileText, Edit, Trash2 } from 'lucide-react'
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

function InterviewsPage() {
  const [storeId, setStoreId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(false)
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
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('store_id', storeId)
        .order('interview_date', { ascending: true })
        .order('interview_time', { ascending: true })

      if (error) throw error
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
  }

  // Find existing calendar event for interview
  const findCalendarEvent = async (interviewId: string) => {
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('created_by', userId)
        .ilike('title', `Interview: %`)
        .ilike('description', `%interviewId: ${interviewId}%`)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error finding calendar event:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in findCalendarEvent:', error)
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
      // Find existing calendar event
      const existingEvent = await findCalendarEvent(interviewId)

      if (existingEvent) {
        // Delete the calendar event
        const { error } = await supabase
          .from('calendar_events')
          .delete()
          .eq('id', existingEvent.id)

        if (error) {
          console.error('Error deleting calendar event:', error)
          throw error
        } else {
          console.log('Calendar event deleted successfully for interview:', interviewId)
          // Invalidate calendar events query to refresh the calendar UI
          queryClient.invalidateQueries({ queryKey: ['calendar-events', userId] })
        }
      } else {
        console.log('No calendar event found to delete for interview:', interviewId)
      }
    } catch (error) {
      console.error('Error in deleteCalendarEvent:', error)
      throw error
    }
  }

  // Create or update calendar event for interview (only for SCHEDULED status)
  const createOrUpdateCalendarEvent = async (interview: Interview, isUpdate: boolean = false) => {
    if (!userId) {
      console.warn('No user ID available for calendar event creation')
      return
    }

    try {
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
            // Invalidate calendar events query to refresh the calendar UI
            queryClient.invalidateQueries({ queryKey: ['calendar-events', userId] })
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
            // Invalidate calendar events query to refresh the calendar UI
            queryClient.invalidateQueries({ queryKey: ['calendar-events', userId] })
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
          // Invalidate calendar events query to refresh the calendar UI
          queryClient.invalidateQueries({ queryKey: ['calendar-events', userId] })
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
        <Button onClick={() => setIsAddDrawerOpen(true)} className="wendys-button">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Interview
        </Button>
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
