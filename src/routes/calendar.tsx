import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isToday, isSameMonth } from 'date-fns'
import { Plus, Edit, Trash2, Bell, Calendar as CalendarIcon, Clock, MapPin, CheckCircle, Circle, Star, MoreHorizontal } from 'lucide-react'

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Star className="h-3 w-3 fill-red-500 text-red-500" />
      case 'medium':
        return <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
      case 'low':
        return <Star className="h-3 w-3 fill-green-500 text-green-500" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-wendys-red via-red-600 to-wendys-dark-red opacity-10"></div>
        <div className="relative px-6 py-8 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-wendys-charcoal to-gray-700 bg-clip-text text-transparent">
                  Calendar
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                  Organize your schedule with beautiful events and smart reminders
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => openEventForm()} 
                  className="wendys-button shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Event
                </Button>
                <Button 
                  onClick={() => openReminderForm()} 
                  variant="outline" 
                  className="border-2 border-wendys-red text-wendys-red hover:bg-wendys-red hover:text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Bell className="h-5 w-5 mr-2" />
                  Add Reminder
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 lg:px-12 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* View Mode Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex bg-white rounded-xl p-1 shadow-lg border border-gray-200">
              {(['month', 'week', 'day'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  onClick={() => setViewMode(mode)}
                  size="sm"
                  className={`rounded-lg px-6 py-2 font-medium transition-all duration-200 ${
                    viewMode === mode 
                      ? 'wendys-button shadow-md' 
                      : 'text-gray-600 hover:text-wendys-charcoal hover:bg-gray-100'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Calendar View */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Calendar Component */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-xl border-0"
                  classNames={{
                    day_selected: "bg-wendys-red text-white hover:bg-wendys-dark-red focus:bg-wendys-dark-red",
                    day_today: "bg-wendys-red/10 text-wendys-red font-bold",
                    day: "h-12 w-12 text-center text-sm p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-lg transition-colors duration-200",
                    head_cell: "text-gray-500 font-semibold text-sm uppercase tracking-wide pb-4",
                    nav_button: "text-gray-600 hover:text-wendys-charcoal hover:bg-gray-100 rounded-lg transition-colors duration-200",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    caption: "relative px-8 py-4 text-center text-xl font-semibold text-wendys-charcoal",
                    caption_label: "text-xl font-semibold text-wendys-charcoal",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    row: "flex w-full mt-2",
                    cell: "h-12 w-12 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  }}
                />
              </div>
            </div>

            {/* Selected Date Details */}
            <div className="space-y-6">
              {/* Selected Date Info */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-wendys-red to-wendys-dark-red rounded-full mb-4">
                    <CalendarIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-wendys-charcoal">
                    {format(selectedDate, 'EEEE')}
                  </h3>
                  <p className="text-lg text-gray-600">
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </p>
                </div>
                
                {/* Events for selected date */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 flex items-center text-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Events ({selectedDateEvents.length})
                  </h4>
                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No events scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateEvents.map(event => (
                        <div key={event.id} className="group bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-blue-900 text-lg">{event.title}</h5>
                              {event.description && (
                                <p className="text-sm text-blue-700 mt-2 leading-relaxed">{event.description}</p>
                              )}
                              <div className="flex items-center text-xs text-blue-600 mt-3 space-x-4">
                                <span className="flex items-center bg-blue-200 px-2 py-1 rounded-full">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {format(parseISO(event.start_date), 'h:mm a')}
                                </span>
                                {event.location && (
                                  <span className="flex items-center bg-blue-200 px-2 py-1 rounded-full">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {event.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEventForm(event)}
                                className="h-8 w-8 p-0 hover:bg-blue-200"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteEventMutation.mutate(event.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reminders for selected date */}
                <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-700 flex items-center text-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                    Reminders ({selectedDateReminders.length})
                  </h4>
                  {selectedDateReminders.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No reminders due</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateReminders.map(reminder => (
                        <div key={reminder.id} className={`group border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
                          reminder.completed 
                            ? 'bg-gray-50 border-gray-200' 
                            : reminder.priority === 'high' 
                              ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' 
                              : reminder.priority === 'medium' 
                                ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200' 
                                : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => toggleReminderMutation.mutate({ 
                                    id: reminder.id, 
                                    completed: !reminder.completed 
                                  })}
                                  className="flex-shrink-0"
                                >
                                  {reminder.completed ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                                  )}
                                </button>
                                <div className="flex items-center space-x-2">
                                  {getPriorityIcon(reminder.priority)}
                                  <h5 className={`font-semibold text-lg ${
                                    reminder.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                                  }`}>
                                    {reminder.title}
                                  </h5>
                                </div>
                              </div>
                              {reminder.description && (
                                <p className={`text-sm mt-2 leading-relaxed ${
                                  reminder.completed ? 'text-gray-500' : 'text-gray-700'
                                }`}>
                                  {reminder.description}
                                </p>
                              )}
                              <div className="flex items-center mt-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  reminder.priority === 'high' 
                                    ? 'bg-red-100 text-red-800' 
                                    : reminder.priority === 'medium' 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : 'bg-green-100 text-green-800'
                                }`}>
                                  {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)} Priority
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openReminderForm(reminder)}
                                className="h-8 w-8 p-0 hover:bg-gray-200"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteReminderMutation.mutate(reminder.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Month View Grid */}
          {viewMode === 'month' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-wendys-charcoal mb-6 text-center">
                {format(selectedDate, 'MMMM yyyy')}
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-500 py-3 px-2">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {monthDays.map((day, index) => {
                  const dayEvents = getEventsForDate(day)
                  const dayReminders = getRemindersForDate(day)
                  const isToday = isToday(day)
                  const isSelected = isSameDay(day, selectedDate)
                  const isCurrentMonth = isSameMonth(day, selectedDate)
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border border-gray-200 cursor-pointer transition-all duration-200 rounded-lg ${
                        !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-gray-50'
                      } ${
                        isToday ? 'bg-gradient-to-br from-wendys-red/20 to-wendys-dark-red/20 border-wendys-red/30 shadow-md' : ''
                      } ${isSelected ? 'bg-blue-50 border-blue-300 shadow-md' : ''}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className={`text-sm font-semibold mb-2 ${
                        isToday ? 'text-wendys-red' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      
                      {/* Event indicators */}
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded-full mb-1 truncate shadow-sm"
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      
                      {/* Reminder indicators */}
                      {dayReminders.slice(0, 2).map((reminder) => (
                        <div
                          key={reminder.id}
                          className={`text-xs px-2 py-1 rounded-full mb-1 truncate shadow-sm ${
                            reminder.completed 
                              ? 'bg-gray-400 text-white' 
                              : reminder.priority === 'high' 
                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                                : reminder.priority === 'medium' 
                                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' 
                                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                          }`}
                          title={reminder.title}
                        >
                          {reminder.title}
                        </div>
                      ))}
                      
                      {/* More items indicator */}
                      {(dayEvents.length + dayReminders.length) > 4 && (
                        <div className="text-xs text-gray-500 text-center bg-gray-100 rounded-full py-1 mt-1">
                          +{dayEvents.length + dayReminders.length - 4} more
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Form Modal */}
      {isEventFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-wendys-charcoal">
                {editingEvent ? 'Edit Event' : 'Add Event'}
              </h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEventFormOpen(false)
                  setEditingEvent(null)
                }}
                className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
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
            }} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingEvent?.title}
                  required
                  className="mt-2 border-gray-300 focus:border-wendys-red focus:ring-wendys-red/20 rounded-lg"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingEvent?.description}
                  rows={3}
                  className="mt-2 border-gray-300 focus:border-wendys-red focus:ring-wendys-red/20 rounded-lg"
                  placeholder="Enter event description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date" className="text-sm font-semibold text-gray-700">Start Date *</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="datetime-local"
                    defaultValue={editingEvent?.start_date?.slice(0, 16)}
                    required
                    className="mt-2 border-gray-300 focus:border-wendys-red focus:ring-wendys-red/20 rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="end_date" className="text-sm font-semibold text-gray-700">End Date</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="datetime-local"
                    defaultValue={editingEvent?.end_date?.slice(0, 16)}
                    className="mt-2 border-gray-300 focus:border-wendys-red focus:ring-wendys-red/20 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  id="all_day"
                  name="all_day"
                  type="checkbox"
                  defaultChecked={editingEvent?.all_day}
                  className="rounded border-gray-300 text-wendys-red focus:ring-wendys-red/20 h-4 w-4"
                />
                <Label htmlFor="all_day" className="text-sm font-medium text-gray-700">All day event</Label>
              </div>

              <div>
                <Label htmlFor="location" className="text-sm font-semibold text-gray-700">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editingEvent?.location}
                  className="mt-2 border-gray-300 focus:border-wendys-red focus:ring-wendys-red/20 rounded-lg"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <Label htmlFor="reminder_type" className="text-sm font-semibold text-gray-700">Reminder</Label>
                <select
                  id="reminder_type"
                  name="reminder_type"
                  defaultValue={editingEvent?.reminder_type || 'none'}
                  className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-wendys-red focus:ring-wendys-red/20"
                >
                  <option value="none">No reminder</option>
                  <option value="15min">15 minutes before</option>
                  <option value="1hour">1 hour before</option>
                  <option value="1day">1 day before</option>
                  <option value="1week">1 week before</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEventFormOpen(false)
                    setEditingEvent(null)
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </Button>
                <Button type="submit" className="wendys-button rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reminder Form Modal */}
      {isReminderFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-wendys-charcoal">
                {editingReminder ? 'Edit Reminder' : 'Add Reminder'}
              </h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsReminderFormOpen(false)
                  setEditingReminder(null)
                }}
                className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
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
            }} className="space-y-6">
              <div>
                <Label htmlFor="reminder_title" className="text-sm font-semibold text-gray-700">Reminder Title *</Label>
                <Input
                  id="reminder_title"
                  name="title"
                  defaultValue={editingReminder?.title}
                  required
                  className="mt-2 border-gray-300 focus:border-wendys-red focus:ring-wendys-red/20 rounded-lg"
                  placeholder="Enter reminder title"
                />
              </div>

              <div>
                <Label htmlFor="reminder_description" className="text-sm font-semibold text-gray-700">Description</Label>
                <Textarea
                  id="reminder_description"
                  name="description"
                  defaultValue={editingReminder?.description}
                  rows={3}
                  className="mt-2 border-gray-300 focus:border-wendys-red focus:ring-wendys-red/20 rounded-lg"
                  placeholder="Enter reminder description"
                />
              </div>

              <div>
                <Label htmlFor="reminder_due_date" className="text-sm font-semibold text-gray-700">Due Date *</Label>
                <Input
                  id="reminder_due_date"
                  name="due_date"
                  type="datetime-local"
                  defaultValue={editingReminder?.due_date?.slice(0, 16)}
                  required
                  className="mt-2 border-gray-300 focus:border-wendys-red focus:ring-wendys-red/20 rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="reminder_priority" className="text-sm font-semibold text-gray-700">Priority</Label>
                <select
                  id="reminder_priority"
                  name="priority"
                  defaultValue={editingReminder?.priority || 'medium'}
                  className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-wendys-red focus:ring-wendys-red/20"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsReminderFormOpen(false)
                    setEditingReminder(null)
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </Button>
                <Button type="submit" className="wendys-button rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
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
