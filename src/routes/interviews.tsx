import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Calendar, Phone, Mail, MapPin, FileText, Upload, CheckCircle, Circle, Clock, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatTime, getStatusColor } from '@/lib/utils'
import { interviewSchema, type InterviewFormData } from '@/lib/schemas'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { supabase, type Tables } from '@/lib/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/interviews')({
  component: InterviewsPage,
})

type InterviewRow = Tables<'interviews'>
type HireRow = Tables<'hires'>

function InterviewsPage() {
  const queryClient = useQueryClient()
  const [storeId, setStoreId] = useState<string | null>(null)
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editingInterview, setEditingInterview] = useState<any>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const { toast } = useToast()

  // Normalize status to match database enum exactly
  const normalizeStatus = (status: string): 'SCHEDULED' | 'DONE' | 'NO_SHOW' | 'HIRED' | 'REJECTED' => {
    const upperStatus = status.toUpperCase()
    console.log('🔍 [Interviews] Normalizing status:', { input: status, upper: upperStatus })
    
    switch (upperStatus) {
      case 'SCHEDULED':
      case 'DONE':
      case 'NO_SHOW':
      case 'HIRED':
      case 'REJECTED':
        console.log('🔍 [Interviews] Status normalized to:', upperStatus)
        return upperStatus as any
      default:
        console.warn('❌ [Interviews] Invalid status value:', status, 'defaulting to SCHEDULED')
        return 'SCHEDULED'
    }
  }

  // Check what enum values are actually valid in the database
  const checkDatabaseEnum = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('status')
        .limit(1)
      
      if (error) {
        console.error('❌ [Interviews] Error checking database enum:', error)
      } else {
        console.log('🔍 [Interviews] Database enum check result:', data)
      }
    } catch (e) {
      console.error('❌ [Interviews] Exception checking database enum:', e)
    }
  }

  const form = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      candidate_name: '',
      phone: '',
      email: '',
      position: '',
      interview_date: format(new Date(), 'yyyy-MM-dd'),
      interview_time: '10:00',
      status: 'SCHEDULED',
      notes: '',
    },
  })

  // Resolve store_id for current user (align with other routes)
  useEffect(() => {
    let active = true
    ;(async () => {
      console.log('🔐 [Interviews] Checking user authentication...')
      const { data: auth, error: authError } = await supabase.auth.getUser()
      console.log('👤 [Interviews] Auth data:', auth, 'Auth error:', authError)
      
      const userId = auth.user?.id
      if (!userId) {
        console.log('❌ [Interviews] No user ID found - user not authenticated')
        return
      }

      console.log('🔍 [Interviews] Looking up store for user:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('store_id')
        .eq('id', userId)
        .maybeSingle()

      console.log('🏪 [Interviews] Store lookup result - data:', data, 'error:', error)

      if (!active) return
      if (error) {
        console.error('❌ [Interviews] Store lookup error:', error)
        return
      }
      setStoreId(data?.store_id ?? null)
      console.log('✅ [Interviews] Store ID set to:', data?.store_id ?? null)
    })()
    return () => { active = false }
  }, [])

  // Fetch interviews for the store
  const { data: interviews = [], isLoading } = useQuery<InterviewRow[]>({
    queryKey: ['interviews', storeId],
    queryFn: async () => {
      if (!storeId) {
        console.log('⚠️ [Interviews] No store ID, skipping fetch')
        return []
      }
      console.log('📊 [Interviews] Fetching interviews for store:', storeId)
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('store_id', storeId)
        .order('interview_date', { ascending: true })
        .order('interview_time', { ascending: true })
      console.log('📋 [Interviews] Fetch result - data:', data, 'error:', error)
      if (error) throw error
      return data || []
    },
    enabled: !!storeId,
  })

  // Fetch hires and map by interview_id for quick lookup
  const { data: hires = [] } = useQuery<HireRow[]>({
    queryKey: ['hires', storeId],
    queryFn: async () => {
      if (!storeId) return []
      const { data, error } = await supabase
        .from('hires')
        .select('*')
        .eq('store_id', storeId)
      if (error) throw error
      return data || []
    },
    enabled: !!storeId,
  })

  const hiresByInterviewId = useMemo(() => {
    const map = new Map<string, HireRow>()
    for (const h of hires) map.set(h.interview_id, h)
    return map
  }, [hires])

  const upsertMutation = useMutation({
    mutationFn: async (payload: { id?: string } & InterviewFormData) => {
      if (!storeId) throw new Error('No store selected')
      
      console.log('🔍 [Interviews] Mutation payload:', payload)
      console.log('🔍 [Interviews] Status value:', payload.status, 'Type:', typeof payload.status)
      
      const base = {
        candidate_name: payload.candidate_name,
        phone: payload.phone || null,
        email: payload.email ? payload.email : null,
        position: (payload.position ?? ''),
        interview_date: payload.interview_date,
        interview_time: payload.interview_time,
        status: normalizeStatus(payload.status),
        notes: payload.notes || null,
      }
      
      console.log('🔍 [Interviews] Base object being sent to Supabase:', base)

      if (payload.id) {
        console.log('🔍 [Interviews] Updating interview with ID:', payload.id)
        const { error } = await supabase
          .from('interviews')
          .update(base)
          .eq('id', payload.id)
        if (error) {
          console.error('❌ [Interviews] Supabase update error:', error)
          console.error('❌ [Interviews] Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })
          throw error
        }
        return
      } else {
        console.log('🔍 [Interviews] Inserting new interview')
        const { error } = await supabase
          .from('interviews')
          .insert([{ ...base, store_id: storeId }])
        if (error) {
          console.error('❌ [Interviews] Supabase insert error:', error)
          console.error('❌ [Interviews] Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })
          throw error
        }
        return
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', storeId] })
      toast({ title: 'Success!', description: editingInterview ? 'Interview updated successfully.' : 'Interview scheduled successfully.' })
      setIsAddDrawerOpen(false)
      setEditingInterview(null)
      form.reset()
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to save interview', variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('interviews').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', storeId] })
      toast({ title: 'Deleted!', description: 'Interview removed successfully.' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete interview', variant: 'destructive' })
    }
  })

  const onSubmit = (data: InterviewFormData) => {
    console.log('🔍 [Interviews] Form submitted with data:', data)
    console.log('🔍 [Interviews] Status from form:', data.status, 'Type:', typeof data.status)
    upsertMutation.mutate(editingInterview ? { id: editingInterview.id, ...data } : data)
  }

  const handleEdit = (interview: any) => {
    console.log('🔍 [Interviews] Editing interview:', interview)
    console.log('🔍 [Interviews] Interview status from DB:', interview.status, 'Type:', typeof interview.status)
    
    setEditingInterview(interview)
    form.reset({
      candidate_name: interview.candidate_name,
      phone: interview.phone || '',
      email: interview.email || '',
      position: interview.position || '',
      interview_date: interview.interview_date,
      interview_time: interview.interview_time,
      status: normalizeStatus(interview.status),
      notes: interview.notes || '',
    })
    setIsAddDrawerOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleViewCandidate = (interview: InterviewRow) => {
    const hire = hiresByInterviewId.get(interview.id)
    setSelectedCandidate({ ...interview, hire })
  }

  const filteredInterviews = useMemo(() => {
    const list = interviews || []
    const lower = searchTerm.toLowerCase()
    return list.filter((interview) => {
      const matchesSearch = interview.candidate_name.toLowerCase().includes(lower) ||
        (interview.position || '').toLowerCase().includes(lower)
      const matchesStatus = statusFilter === 'ALL' || interview.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [interviews, searchTerm, statusFilter])

  const groupedInterviews = useMemo(() => {
    return filteredInterviews.reduce((groups: Record<string, InterviewRow[]>, interview) => {
      const date = interview.interview_date
      if (!groups[date]) groups[date] = []
      groups[date].push(interview)
      return groups
    }, {} as Record<string, InterviewRow[]>)
  }, [filteredInterviews])

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
            <SelectItem value="DONE">Completed</SelectItem>
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
                          <span>{interview.position}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
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
                        <p className="text-sm text-gray-600 mt-2">{interview.notes}</p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCandidate(interview)}
                        className="h-8 w-8 p-0"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(interview)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(interview.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
                {editingInterview ? 'Edit Interview' : 'Schedule Interview'}
              </h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddDrawerOpen(false)
                  setEditingInterview(null)
                  form.reset()
                }}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!storeId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                  Your account isn’t linked to a store yet. Open Setup and link your user to a store before adding interviews.
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="candidate_name">Candidate Name *</Label>
                  <Input
                    id="candidate_name"
                    {...form.register('candidate_name')}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    {...form.register('position')}
                    placeholder="e.g., Team Member, Shift Leader"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...form.register('phone')}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="candidate@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interview_date">Interview Date *</Label>
                  <Input
                    id="interview_date"
                    type="date"
                    {...form.register('interview_date')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interview_time">Interview Time *</Label>
                  <Input
                    id="interview_time"
                    type="time"
                    {...form.register('interview_time')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) => form.setValue('status', normalizeStatus(value))}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="DONE">Completed</SelectItem>
                      <SelectItem value="NO_SHOW">No Show</SelectItem>
                      <SelectItem value="HIRED">Hired</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Additional notes about the candidate..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDrawerOpen(false)
                    setEditingInterview(null)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="wendys-button" disabled={upsertMutation.isPending || !storeId}>
                  {editingInterview ? 'Update Interview' : 'Schedule Interview'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-wendys-charcoal">
                Candidate: {selectedCandidate.candidate_name}
              </h2>
              <Button
                variant="ghost"
                onClick={() => setSelectedCandidate(null)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Interview Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-wendys-charcoal">Interview Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Position:</span>
                    <span className="font-medium">{selectedCandidate.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDate(selectedCandidate.interview_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{formatTime(selectedCandidate.interview_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCandidate.status)}`}>
                      {selectedCandidate.status.replace('_', ' ')}
                    </span>
                  </div>
                  {selectedCandidate.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedCandidate.phone}</span>
                    </div>
                  )}
                  {selectedCandidate.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedCandidate.email}</span>
                    </div>
                  )}
                  {selectedCandidate.notes && (
                    <div className="space-y-2">
                      <span className="text-gray-600">Notes:</span>
                      <p className="text-sm bg-gray-50 p-3 rounded">{selectedCandidate.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hiring Process */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-wendys-charcoal">Hiring Process</h3>
                {selectedCandidate.hire ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Documents Received</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Onboarding Sent</span>
                        <span className="text-xs text-gray-500">({formatDate(selectedCandidate.hire.onboarding_sent_date)})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Onboarding Completed</span>
                        <span className="text-xs text-gray-500">({formatDate(selectedCandidate.hire.onboarding_completed_date)})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Manager Reviewed</span>
                        <span className="text-xs text-gray-500">({formatDate(selectedCandidate.hire.manager_reviewed_date)})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Entered in System</span>
                        <span className="text-xs text-gray-500">({formatDate(selectedCandidate.hire.entered_in_system_date)})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Circle className="h-5 w-5 text-gray-400" />
                        <span className="text-sm">Fingerprint Scheduled</span>
                        <span className="text-xs text-gray-500">({formatDate(selectedCandidate.hire.fingerprint_scheduled_date)})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Circle className="h-5 w-5 text-gray-400" />
                        <span className="text-sm">First Day</span>
                        <span className="text-xs text-gray-500">({formatDate(selectedCandidate.hire.first_day)})</span>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button className="wendys-button w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Documents
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No hiring process started yet.</p>
                    <Button className="wendys-button">
                      Start Hiring Process
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
