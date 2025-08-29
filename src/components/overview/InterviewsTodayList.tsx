import { Calendar, Clock, User, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { getStatusColor } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import { supabase, type Tables } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

type InterviewRow = Tables<'interviews'>

export function InterviewsTodayList() {
  const [storeId, setStoreId] = useState<string | null>(null)
  const todayLabel = format(new Date(), 'EEEE, MMMM d')
  const todayDate = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    let active = true
    ;(async () => {
      console.log('🔐 [InterviewsToday] Checking user authentication...')
      const { data: auth, error: authError } = await supabase.auth.getUser()
      console.log('👤 [InterviewsToday] Auth data:', auth, 'Auth error:', authError)
      
      const userId = auth.user?.id
      if (!userId) {
        console.log('❌ [InterviewsToday] No user ID found - user not authenticated')
        return
      }

      console.log('🔍 [InterviewsToday] Looking up store for user:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('store_id')
        .eq('id', userId)
        .maybeSingle()

      console.log('🏪 [InterviewsToday] Store lookup result - data:', data, 'error:', error)

      if (!active) return
      if (error) {
        console.error('❌ [InterviewsToday] Store lookup error:', error)
        return
      }
      setStoreId(data?.store_id ?? null)
      console.log('✅ [InterviewsToday] Store ID set to:', data?.store_id ?? null)
    })()
    return () => { active = false }
  }, [])

  const { data: interviews = [], isLoading } = useQuery<InterviewRow[]>({
    queryKey: ['interviews-today', storeId, todayDate],
    queryFn: async () => {
      if (!storeId) return []
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('store_id', storeId)
        .eq('interview_date', todayDate)
        .order('interview_time', { ascending: true })
      if (error) throw error
      return data || []
    },
    enabled: !!storeId,
  })
  
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
          <span>{todayLabel}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : interviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No interviews scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => (
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
