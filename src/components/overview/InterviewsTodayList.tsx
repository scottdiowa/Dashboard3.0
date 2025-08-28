import { Calendar, Clock, User, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { getStatusColor } from '@/lib/utils'

// TODO: Replace with real data from Supabase
const mockInterviews: any[] = []

export function InterviewsTodayList() {
  const today = format(new Date(), 'EEEE, MMMM d')
  
  const formatTime = (time: string) => {
    return format(new Date(`2000-01-01T${time}`), 'h:mm a')
  }

  return (
    <div className="wendys-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-wendys-charcoal">
          Interviews Today
        </h3>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{today}</span>
        </div>
      </div>

      {mockInterviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No interviews scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mockInterviews.map((interview) => (
            <Link
              key={interview.id}
              to="/interviews"
              className="block p-4 border border-gray-200 rounded-lg hover:border-wendys-red hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-wendys-charcoal">
                      {interview.candidate_name}
                    </h4>
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      getStatusColor(interview.status)
                    )}>
                      {interview.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{interview.position}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(interview.interview_time)}</span>
                    </div>
                  </div>
                  
                  {interview.notes && (
                    <p className="text-sm text-gray-500 mt-2 italic">
                      "{interview.notes}"
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <Link
          to="/interviews"
          className="inline-flex items-center space-x-2 text-wendys-red hover:text-wendys-dark-red font-medium text-sm"
        >
          <span>View all interviews</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
