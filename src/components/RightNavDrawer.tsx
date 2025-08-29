import { BarChart3, Calendar, Users, TrendingUp, Wrench, Target } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

interface RightNavDrawerProps {
  open: boolean
}

const navigationItems = [
  {
    name: 'Overview',
    href: '/overview',
    icon: BarChart3,
    description: 'Key metrics and trends'
  },
  {
    name: 'Omega Daily',
    href: '/omega-daily',
    icon: TrendingUp,
    description: 'Daily business metrics'
  },
  {
    name: 'Interviews & Hires',
    href: '/interviews',
    icon: Users,
    description: 'Manage candidates and hiring'
  },
  {
    name: 'OSAT',
    href: '/smg',
    icon: Calendar,
    description: 'Customer feedback metrics'
  }
  ,{
    name: 'Goal Setting',
    href: '/goals',
    icon: Target,
    description: 'Set goals & track progress'
  }
  ,{
    name: 'Setup',
    href: '/setup',
    icon: Wrench,
    description: 'Copy SQL & configure'
  }
]

export function RightNavDrawer({ open }: RightNavDrawerProps) {
  const location = useLocation()

  return (
    <>
      {/* Sidebar (left-aligned, scrolls with page) */}
      <div className={cn(
        "bg-white shadow-2xl border-r border-gray-100 transition-[width] duration-300 ease-in-out shrink-0 overflow-hidden",
        open ? "w-48" : "w-0"
      )}>
        <div className="flex flex-col h-full relative">

          {/* Navigation Items */}
          <nav className={cn(
            "overflow-y-auto",
            open ? "p-3" : "p-2.5"
          )}>
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center transition-colors duration-200",
                      open 
                        ? "space-x-2 p-2 rounded-md mx-2" 
                        : "justify-center p-2 rounded-md mx-1",
                      isActive 
                        ? "bg-wendys-red text-white ring-1 ring-red-200" 
                        : "text-gray-700 hover:bg-gray-50 hover:ring-1 hover:ring-gray-200"
                    )}
                  >
                    {/* Keep layout stable; use native title in collapsed state */}
                    
                    <div className={cn(
                      "flex-shrink-0 p-2 rounded-md",
                      isActive 
                        ? "bg-white/20" 
                        : "bg-gray-100"
                    )}>
                      <Icon className={cn(
                        "h-4.5 w-4.5",
                        isActive ? "text-white" : "text-gray-600"
                      )} />
                    </div>
                    
                    {open && (
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "font-medium text-sm",
                          isActive ? "text-white" : "text-gray-800"
                        )}>
                          {item.name}
                        </div>
                        <div className={cn(
                          "text-xs mt-0.5",
                          isActive ? "text-red-100" : "text-gray-500"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </div>
      
      
    </>
  )
}