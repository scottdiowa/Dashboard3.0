import { createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RightNavDrawer } from '@/components/RightNavDrawer'
import { Header } from '@/components/Header'
import { LoginScreen } from '@/components/LoginScreen'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [navOpen, setNavOpen] = useState(() => {
    const saved = localStorage.getItem('navOpen')
    return saved ? JSON.parse(saved) : true
  })
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        // In mock mode, simulate a logged-in user
        if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.trim() === '') {
          setUser({
            id: 'mock-user-id',
            email: 'gm@wendys-se14th.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          })
          setLoading(false)
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        // In case of error, still proceed with mock user for development
        setUser({
          id: 'mock-user-id',
          email: 'gm@wendys-se14th.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        })
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes only in production mode
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.trim() !== '') {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user)
            toast({
              title: "Welcome back!",
              description: "Successfully signed in to your dashboard.",
            })
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            navigate({ to: '/' })
            toast({
              title: "Signed out",
              description: "You have been successfully signed out.",
            })
          }
        }
      )

      return () => subscription.unsubscribe()
    }
  }, [navigate, toast])

  useEffect(() => {
    localStorage.setItem('navOpen', JSON.stringify(navOpen))
  }, [navOpen])

  if (loading) {
    return (
      <div className="min-h-screen bg-wendys-gray flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wendys-red mx-auto mb-4"></div>
          <p className="text-wendys-charcoal">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen bg-wendys-gray">
      <Header 
        user={user} 
        onNavToggle={() => setNavOpen(!navOpen)}
        navOpen={navOpen}
      />
      <div className="flex">
        <RightNavDrawer open={navOpen} />
        <main className={cn(
          "flex-1 p-6 transition-all duration-300 ease-in-out",
          navOpen ? "ml-0" : "ml-0"
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
