import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
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

export const Route = createFileRoute('/interviews')({
  component: InterviewsPage,
})

// TODO: Replace with real data from Supabase
const mockInterviews: any[] = []

// TODO: Replace with real data from Supabase
const mockHires: any[] = []

function InterviewsPage() {
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editingInterview, setEditingInterview] = useState<any>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const { toast } = useToast()

  const form = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      candidate_name: '',
      phone: '',
      email: '',
      position: '',
      interview_date: formatDate(new Date()),
      interview_time: '10:00',
      status: 'SCHEDULED',
      notes: '',
    },
  })

  const onSubmit = (data: InterviewFormData) => {
    // TODO: Replace with actual Supabase call
    console.log('Submitting interview:', data)
    toast({
      title: "Success!",
      description: editingInterview ? "Interview updated successfully." : "Interview scheduled successfully.",
    })
    setIsAddDrawerOpen(false)
    setEditingInterview(null)
    form.reset()
  }

  const handleEdit = (interview: any) => {
    setEditingInterview(interview)
    form.reset({
      candidate_name: interview.candidate_name,
      phone: interview.phone || '',
      email: interview.email || '',
      position: interview.position || '',
      interview_date: interview.interview_date,
      interview_time: interview.interview_time,
      status: interview.status,
      notes: interview.notes || '',
    })
    setIsAddDrawerOpen(true)
  }

  const handleDelete = (id: string) => {
    // TODO: Replace with actual Supabase call
    console.log('Deleting interview:', id)
    toast({
      title: "Deleted!",
      description: "Interview removed successfully.",
    })
  }

  const handleViewCandidate = (interview: any) => {
    const hire = mockHires.find(h => h.interview_id === interview.id)
    setSelectedCandidate({ ...interview, hire })
  }

  const filteredInterviews = mockInterviews.filter(interview => {
    const matchesSearch = interview.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || interview.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const groupedInterviews = filteredInterviews.reduce((groups: Record<string, any[]>, interview) => {
    const date = interview.interview_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(interview)
    return groups
  }, {} as Record<string, typeof mockInterviews>)

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
                    onValueChange={(value) => form.setValue('status', value as any)}
                  >
                    <SelectTrigger>
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
                <Button type="submit" className="wendys-button">
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
