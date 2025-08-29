import { BarChart3, Calendar, Users, TrendingUp, Wrench, Target, Search, Star, Clock } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'

interface RightNavDrawerProps {
  open: boolean
}

const navigationItems = [
  {
    name: 'Overview',
    href: '/overview',
    icon: BarChart3,
    description: 'Key metrics and trends',
    category: 'main',
    priority: 'high'
  },
  {
    name: 'Omega Daily',
    href: '/omega-daily',
    icon: TrendingUp,
    description: 'Daily business metrics',
    category: 'main',
    priority: 'high'
  },
  {
    name: 'Interviews & Hires',
    href: '/interviews',
    icon: Users,
    description: 'Manage candidates and hiring',
    category: 'main',
    priority: 'medium'
  },
  {
    name: 'OSAT',
    href: '/smg',
    icon: Calendar,
    description: 'Customer feedback metrics',
    category: 'main',
    priority: 'medium'
  },
  {
    name: 'Goal Setting',
    href: '/goals',
    icon: Target,
    description: 'Set goals & track progress',
    category: 'main',
    priority: 'medium'
  },
  {
    name: 'Setup',
    href: '/setup',
    icon: Wrench,
    description: 'Copy SQL & configure',
    category: 'main',
    priority: 'low'
  }
]

export function RightNavDrawer({ open }: RightNavDrawerProps) {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  // Filter navigation items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return navigationItems
    
    const query = searchQuery.toLowerCase()
    return navigationItems.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Get recent items (mock data - you can implement real logic)
  const recentItems = useMemo(() => {
    return navigationItems.slice(0, 3).map(item => ({
      ...item,
      lastVisited: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    }))
  }, [])

  return (
    <>
      {/* Sidebar (left-aligned, scrolls with page) */}
      <div className={cn(
        "bg-gradient-to-b from-white to-gray-50 shadow-2xl border-r border-gray-200 transition-[width] duration-300 ease-in-out shrink-0 overflow-hidden",
        open ? "w-64" : "w-16"
      )}>
        <div className="flex flex-col h-full relative">
          
          {/* Search Bar - Only show when expanded */}
          {open && (
            <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search navigation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 bg-gray-50 border-gray-200 focus:border-wendys-red focus:ring-wendys-red/20"
                />
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className={cn(
            "overflow-y-auto flex-1",
            open ? "p-4" : "p-2"
          )}>
            
            {/* Recent Items Section - Only show when expanded and no search */}
            {open && !searchQuery.trim() && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Recent</span>
                </div>
                <div className="space-y-1">
                  {recentItems.map((item) => {
                    const isActive = location.pathname === item.href
                    const Icon = item.icon
                    
                    return (
                      <Link
                        key={`recent-${item.href}`}
                        to={item.href}
                        className={cn(
                          "flex items-center space-x-3 p-2 rounded-md transition-all duration-200 group",
                          isActive 
                            ? "bg-wendys-red text-white ring-1 ring-red-200" 
                            : "text-gray-700 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-gray-200"
                        )}
                      >
                        <div className={cn(
                          "flex-shrink-0 p-1.5 rounded-md transition-colors duration-200",
                          isActive 
                            ? "bg-white/20" 
                            : "bg-gray-100 group-hover:bg-wendys-red/10"
                        )}>
                          <Icon className={cn(
                            "h-4 w-4",
                            isActive ? "text-white" : "text-gray-600 group-hover:text-wendys-red"
                          )} />
                        </div>
                        
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
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Main Navigation */}
            <div className="space-y-1">
              {filteredItems.map((item) => {
                const isActive = location.pathname === item.href
                const Icon = item.icon
                
                return (
                  <div key={item.href} className="relative">
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center transition-all duration-200 group relative",
                        open 
                          ? "space-x-3 p-3 rounded-lg mx-0" 
                          : "justify-center p-3 rounded-lg mx-1",
                        isActive 
                          ? "bg-gradient-to-r from-wendys-red to-wendys-dark-red text-white shadow-lg ring-1 ring-red-200" 
                          : "text-gray-700 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-gray-200"
                      )}
                      onMouseEnter={() => !open && setShowTooltip(item.href)}
                      onMouseLeave={() => !open && setShowTooltip(null)}
                    >
                      {/* Icon Container */}
                      <div className={cn(
                        "flex-shrink-0 p-2 rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-white/20" 
                          : "bg-gray-100 group-hover:bg-wendys-red/10 group-hover:scale-110"
                      )}>
                        <Icon className={cn(
                          "h-5 w-5 transition-colors duration-200",
                          isActive ? "text-white" : "text-gray-600 group-hover:text-wendys-red"
                        )} />
                      </div>
                      
                      {/* Text Content - Only show when expanded */}
                      {open && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <div className={cn(
                              "font-semibold text-sm",
                              isActive ? "text-white" : "text-gray-800"
                            )}>
                              {item.name}
                            </div>
                            {item.priority === 'high' && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <div className={cn(
                            "text-xs mt-1",
                            isActive ? "text-red-100" : "text-gray-500"
                          )}>
                            {item.description}
                          </div>
                        </div>
                      )}
                    </Link>

                    {/* Tooltip for collapsed state */}
                    {!open && showTooltip === item.href && (
                      <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50">
                        <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-gray-300 text-xs mt-1">{item.description}</div>
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* No Results Message */}
            {searchQuery.trim() && filteredItems.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No navigation items found</p>
                <p className="text-gray-400 text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </nav>

          {/* Footer - Only show when expanded */}
          {open && (
            <div className="p-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-8 h-8 bg-wendys-red rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <p className="text-xs text-gray-500">Dashboard v3.0</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}