import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { Plus, Edit, Trash2, Bell, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'

import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/calendar')({
  component: CalendarPage,
})

type Event = {
  id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  all_day: boolean
  location?: string
  reminder_time?: string
  reminder_type: 'none' | '15min' | '1hour' | '1day' | '1week'
  created_by: string
  created_at: string
  updated_at: string
}

type Reminder = {
  id: string
  title: string
  description?: string
  due_date: string
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  created_by: string
  created_at: string
  updated_at: string
}

function CalendarPage() {
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [isReminderFormOpen, setIsReminderFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [])

  // Fetch events
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['calendar-events', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('created_by', userId)
        .order('start_date', { ascending: true })
      if (error) throw error
      return data || []
    },
    enabled: !!userId
  })

  // Fetch reminders
  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ['calendar-reminders', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('calendar_reminders')
        .select('*')
        .eq('created_by', userId)
        .order('due_date', { ascending: true })
      if (error) throw error
      return data || []
    },
    enabled: !!userId
  })

  // Event mutations
  const eventMutation = useMutation({
    mutationFn: async (eventData: Omit<Event, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      if (!userId) throw new Error('User not authenticated')
      
      if (editingEvent) {
        const { error } = await supabase
          .from('calendar_events')
          .update({
            ...eventData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEvent.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('calendar_events')
          .insert({
            ...eventData,
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast({
        title: editingEvent ? 'Event updated!' : 'Event created!',
        description: editingEvent ? 'Your event has been updated successfully.' : 'Your event has been created successfully.'
      })
      setIsEventFormOpen(false)
      setEditingEvent(null)
      queryClient.invalidateQueries({ queryKey: ['calendar-events', userId] })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save event',
        variant: 'destructive'
      })
    }
  })

  // Reminder mutations
  const reminderMutation = useMutation({
    mutationFn: async (reminderData: Omit<Reminder, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      if (!userId) throw new Error('User not authenticated')
      
      if (editingReminder) {
        const { error } = await supabase
          .from('calendar_reminders')
          .update({
            ...reminderData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingReminder.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('calendar_reminders')
          .insert({
            ...reminderData,
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast({
        title: editingReminder ? 'Reminder updated!' : 'Reminder created!',
        description: editingReminder ? 'Your reminder has been updated successfully.' : 'Your reminder has been created successfully.'
      })
      setIsReminderFormOpen(false)
      setEditingReminder(null)
      queryClient.invalidateQueries({ queryKey: ['calendar-reminders', userId] })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save reminder',
        variant: 'destructive'
      })
    }
  })

  // Delete mutations
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Event deleted', description: 'Event has been removed successfully.' })
      queryClient.invalidateQueries({ queryKey: ['calendar-events', userId] })
    },
    onError: (error: any) => {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    }
  })

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_reminders').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Reminder deleted', description: 'Reminder has been removed successfully.' })
      queryClient.invalidateQueries({ queryKey: ['calendar-reminders', userId] })
    },
    onError: (error: any) => {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    }
  })

  // Toggle reminder completion
  const toggleReminderMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('calendar_reminders')
        .update({ completed, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-reminders', userId] })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  })

  // Get events for selected date
  const selectedDateEvents = events.filter(event => 
    isSameDay(parseISO(event.start_date), selectedDate)
  )

  const selectedDateReminders = reminders.filter(reminder => 
    isSameDay(parseISO(reminder.due_date), selectedDate)
  )

  // Get month view data
  const monthDays = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate)
  })

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(parseISO(event.start_date), date))
  }

  const getRemindersForDate = (date: Date) => {
    return reminders.filter(reminder => isSameDay(parseISO(reminder.due_date), date))
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const openEventForm = (event?: Event) => {
    setEditingEvent(event || null)
    setIsEventFormOpen(true)
  }

  const openReminderForm = (reminder?: Reminder) => {
    setEditingReminder(reminder || null)
    setIsReminderFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-wendys-charcoal">Calendar</h1>
          <p className="text-gray-600 mt-1">Manage your events and reminders</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => openEventForm()} className="wendys-button">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
          <Button onClick={() => openReminderForm()} variant="outline" className="border-wendys-red text-wendys-red hover:bg-wendys-red hover:text-white">
            <Bell className="h-4 w-4 mr-2" />
            Add Reminder
          </Button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'month' ? 'default' : 'outline'}
          onClick={() => setViewMode('month')}
          size="sm"
        >
          Month
        </Button>
        <Button
          variant={viewMode === 'week' ? 'default' : 'outline'}
          onClick={() => setViewMode('week')}
          size="sm"
        >
          Week
        </Button>
        <Button
          variant={viewMode === 'day' ? 'default' : 'outline'}
          onClick={() => setViewMode('day')}
          size="sm"
        >
          Day
        </Button>
      </div>

      {/* Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Component */}
        <div className="lg:col-span-2">
          <div className="wendys-card">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border"
            />
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="space-y-4">
          {/* Selected Date Info */}
          <div className="wendys-card">
            <h3 className="text-lg font-semibold text-wendys-charcoal mb-3">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            
            {/* Events for selected date */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Events ({selectedDateEvents.length})
              </h4>
              {selectedDateEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No events scheduled</p>
              ) : (
                selectedDateEvents.map(event => (
                  <div key={event.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-blue-900">{event.title}</h5>
                        {event.description && (
                          <p className="text-sm text-blue-700 mt-1">{event.description}</p>
                        )}
                        <div className="flex items-center text-xs text-blue-600 mt-2 space-x-3">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(parseISO(event.start_date), 'h:mm a')}
                          </span>
                          {event.location && (
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEventForm(event)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEventMutation.mutate(event.id)}
                          className="h-6 w-6 p-0 text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reminders for selected date */}
            <div className="space-y-3 mt-4">
              <h4 className="font-medium text-gray-700 flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Reminders ({selectedDateReminders.length})
              </h4>
              {selectedDateReminders.length === 0 ? (
                <p className="text-sm text-gray-500">No reminders due</p>
              ) : (
                selectedDateReminders.map(reminder => (
                  <div key={reminder.id} className={`border rounded-lg p-3 ${
                    reminder.completed 
                      ? 'bg-gray-50 border-gray-200' 
                      : reminder.priority === 'high' 
                        ? 'bg-red-50 border-red-200' 
                        : reminder.priority === 'medium' 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={reminder.completed}
                            onChange={(e) => toggleReminderMutation.mutate({ 
                              id: reminder.id, 
                              completed: e.target.checked 
                            })}
                            className="rounded border-gray-300 text-wendys-red focus:ring-wendys-red"
                          />
                          <h5 className={`font-medium ${
                            reminder.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}>
                            {reminder.title}
                          </h5>
                        </div>
                        {reminder.description && (
                          <p className={`text-sm mt-1 ${
                            reminder.completed ? 'text-gray-500' : 'text-gray-700'
                          }`}>
                            {reminder.description}
                          </p>
                        )}
                        <div className="flex items-center text-xs text-gray-600 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            reminder.priority === 'high' 
                              ? 'bg-red-100 text-red-800' 
                              : reminder.priority === 'medium' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {reminder.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openReminderForm(reminder)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReminderMutation.mutate(reminder.id)}
                          className="h-6 w-6 p-0 text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Month View Grid */}
      {viewMode === 'month' && (
        <div className="wendys-card">
          <h3 className="text-lg font-semibold text-wendys-charcoal mb-4">
            {format(selectedDate, 'MMMM yyyy')}
          </h3>
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {monthDays.map((day, index) => {
              const dayEvents = getEventsForDate(day)
              const dayReminders = getRemindersForDate(day)
              const isToday = isSameDay(day, new Date())
              const isSelected = isSameDay(day, selectedDate)
              
              return (
                <div
                  key={index}
                  className={`min-h-[80px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    isToday ? 'bg-wendys-red/10 border-wendys-red' : ''
                  } ${isSelected ? 'bg-blue-50 border-blue-300' : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {format(day, 'd')}
                  </div>
                  
                  {/* Event indicators */}
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded mb-1 truncate"
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  
                  {/* Reminder indicators */}
                  {dayReminders.slice(0, 2).map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`text-xs px-1 py-0.5 rounded mb-1 truncate ${
                        reminder.completed 
                          ? 'bg-gray-100 text-gray-600' 
                          : reminder.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : reminder.priority === 'medium' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                      }`}
                      title={reminder.title}
                    >
                      {reminder.title}
                    </div>
                  ))}
                  
                  {/* More items indicator */}
                  {(dayEvents.length + dayReminders.length) > 4 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length + dayReminders.length - 4} more
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {isEventFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-wendys-charcoal">
                {editingEvent ? 'Edit Event' : 'Add Event'}
              </h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEventFormOpen(false)
                  setEditingEvent(null)
                }}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const eventData = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                start_date: formData.get('start_date') as string,
                end_date: formData.get('end_date') as string || undefined,
                all_day: formData.get('all_day') === 'on',
                location: formData.get('location') as string,
                reminder_type: formData.get('reminder_type') as 'none' | '15min' | '1hour' | '1day' | '1week'
              }
              eventMutation.mutate(eventData)
            }} className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingEvent?.title}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingEvent?.description}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="datetime-local"
                    defaultValue={editingEvent?.start_date?.slice(0, 16)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="datetime-local"
                    defaultValue={editingEvent?.end_date?.slice(0, 16)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="all_day"
                  name="all_day"
                  type="checkbox"
                  defaultChecked={editingEvent?.all_day}
                  className="rounded border-gray-300 text-wendys-red focus:ring-wendys-red"
                />
                <Label htmlFor="all_day">All day event</Label>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editingEvent?.location}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="reminder_type">Reminder</Label>
                <select
                  id="reminder_type"
                  name="reminder_type"
                  defaultValue={editingEvent?.reminder_type || 'none'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-wendys-red focus:ring-wendys-red"
                >
                  <option value="none">No reminder</option>
                  <option value="15min">15 minutes before</option>
                  <option value="1hour">1 hour before</option>
                  <option value="1day">1 day before</option>
                  <option value="1week">1 week before</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEventFormOpen(false)
                    setEditingEvent(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="wendys-button">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reminder Form Modal */}
      {isReminderFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-wendys-charcoal">
                {editingReminder ? 'Edit Reminder' : 'Add Reminder'}
              </h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsReminderFormOpen(false)
                  setEditingReminder(null)
                }}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const reminderData = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                due_date: formData.get('due_date') as string,
                priority: formData.get('priority') as 'low' | 'medium' | 'high',
                completed: false
              }
              reminderMutation.mutate(reminderData)
            }} className="space-y-4">
              <div>
                <Label htmlFor="reminder_title">Reminder Title *</Label>
                <Input
                  id="reminder_title"
                  name="title"
                  defaultValue={editingReminder?.title}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="reminder_description">Description</Label>
                <Textarea
                  id="reminder_description"
                  name="description"
                  defaultValue={editingReminder?.description}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="reminder_due_date">Due Date *</Label>
                <Input
                  id="reminder_due_date"
                  name="due_date"
                  type="datetime-local"
                  defaultValue={editingReminder?.due_date?.slice(0, 16)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="reminder_priority">Priority</Label>
                <select
                  id="reminder_priority"
                  name="priority"
                  defaultValue={editingReminder?.priority || 'medium'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-wendys-red focus:ring-wendys-red"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsReminderFormOpen(false)
                    setEditingReminder(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="wendys-button">
                  {editingReminder ? 'Update Reminder' : 'Create Reminder'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
