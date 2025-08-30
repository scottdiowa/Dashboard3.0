import { createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
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
    // Default to closed on mobile, open on desktop
    const defaultOpen = typeof window !== 'undefined' ? window.innerWidth >= 768 : true
    return saved ? JSON.parse(saved) : defaultOpen
  })
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const navRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  // Handle mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Auto-close nav on mobile when switching to mobile view
      if (mobile && navOpen) {
        setNavOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [navOpen])

  // Handle escape key and click outside for mobile nav
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && navOpen && isMobile) {
        setNavOpen(false)
      }
    }
    
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobile && navOpen && navRef.current && !navRef.current.contains(e.target as Node)) {
        setNavOpen(false)
      }
    }
    
    if (navOpen && isMobile) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent body scroll when nav is open on mobile
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [navOpen, isMobile])

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
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <Header 
        user={user} 
        onNavToggle={() => setNavOpen(!navOpen)}
        navOpen={navOpen}
        isMobile={isMobile}
      />
      
      <div className="flex relative">
        {/* Mobile overlay */}
        {isMobile && navOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
            onClick={() => setNavOpen(false)}
          />
        )}
        
        <RightNavDrawer 
          open={navOpen} 
          isMobile={isMobile}
          onClose={() => setNavOpen(false)}
          ref={navRef}
        />
        
        <main 
          id="main-content"
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out mobile-container",
            !isMobile && navOpen ? "ml-0" : "ml-0"
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
