import { BarChart3, Calendar, Users, TrendingUp, Wrench, Target, Search, Star, MessageSquare, FileText, Settings, Package, ChevronDown, ChevronRight } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useState, useMemo, forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface RightNavDrawerProps {
  open: boolean
  isMobile: boolean
  onClose: () => void
}

// Define navigation categories with better organization
const navigationCategories = [
  {
    id: 'dashboard',
    name: 'Dashboard & Analytics',
    icon: BarChart3,
    items: [
      {
        name: 'Overview',
        href: '/overview',
        icon: BarChart3,
        description: 'Key metrics and trends',
        priority: 'high'
      },
      {
        name: 'Omega Daily',
        href: '/omega-daily',
        icon: TrendingUp,
        description: 'Daily business metrics',
        priority: 'high'
      },
      {
        name: 'Weekending Sheet',
        href: '/weekending-sheet',
        icon: FileText,
        description: 'Weekly operational data',
        priority: 'high'
      }
    ]
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: Calendar,
    items: [
      {
        name: 'Calendar',
        href: '/calendar',
        icon: Calendar,
        description: 'Events and reminders',
        priority: 'medium'
      },
      {
        name: 'Interviews & Hires',
        href: '/interviews',
        icon: Users,
        description: 'Manage candidates and hiring',
        priority: 'medium'
      },
      {
        name: 'Soft Inventory',
        href: '/soft-inventory',
        icon: Package,
        description: 'Track variance percentages',
        priority: 'medium'
      }
    ]
  },
  {
    id: 'performance',
    name: 'Performance & Goals',
    icon: Target,
    items: [
      {
        name: 'OSAT',
        href: '/smg',
        icon: MessageSquare,
        description: 'Customer feedback metrics',
        priority: 'medium'
      },
      {
        name: 'Goal Setting',
        href: '/goals',
        icon: Target,
        description: 'Set goals & track progress',
        priority: 'medium'
      }
    ]
  },
  {
    id: 'system',
    name: 'System',
    icon: Settings,
    items: [
      {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'Configure dashboard preferences',
        priority: 'low'
      },
      {
        name: 'Setup',
        href: '/setup',
        icon: Wrench,
        description: 'Copy SQL & configure',
        priority: 'low'
      }
    ]
  }
]

export const RightNavDrawer = forwardRef<HTMLDivElement, RightNavDrawerProps>(
  ({ open, isMobile, onClose }, ref) => {
    const location = useLocation()
    const [searchQuery, setSearchQuery] = useState('')
    const [showTooltip, setShowTooltip] = useState<string | null>(null)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['dashboard', 'operations']))

    // Flatten all items for search
    const allItems = useMemo(() => {
      return navigationCategories.flatMap(category => 
        category.items.map(item => ({ ...item, categoryId: category.id, categoryName: category.name }))
      )
    }, [])

    // Filter navigation items based on search
    const filteredItems = useMemo(() => {
      if (!searchQuery.trim()) return allItems
      
      const query = searchQuery.toLowerCase()
      return allItems.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query)
      )
    }, [searchQuery, allItems])


    const handleNavClick = () => {
      if (isMobile) {
        onClose()
      }
    }

    const toggleCategory = (categoryId: string) => {
      setExpandedCategories(prev => {
        const newSet = new Set(prev)
        if (newSet.has(categoryId)) {
          newSet.delete(categoryId)
        } else {
          newSet.add(categoryId)
        }
        return newSet
      })
    }

    const renderNavigationItem = (item: any, isSearchMode: boolean = false) => {
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
                : "text-gray-700 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-gray-200",
              isSearchMode && open && "ml-4" // Indent in search mode
            )}
            onMouseEnter={() => !open && setShowTooltip(item.href)}
            onMouseLeave={() => !open && setShowTooltip(null)}
            onClick={handleNavClick}
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
    }

    if (isMobile) {
      return (
        <div
          ref={ref}
          className={cn(
            "fixed top-0 left-0 w-80 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Mobile nav header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-wendys-red rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <h2 className="font-semibold text-wendys-charcoal">Navigation</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="tap"
                aria-label="Close navigation"
              >
                ×
              </Button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search navigation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:border-wendys-red focus:ring-wendys-red/20"
                />
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto p-4">
              {searchQuery.trim() ? (
                // Search mode - show flat list
                <div className="space-y-2">
                  {filteredItems.map((item) => renderNavigationItem(item, true))}
                </div>
              ) : (
                // Normal mode - show categorized
                <div className="space-y-4">
                  {navigationCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      {/* Category Header */}
                      <div className="flex items-center space-x-2 text-gray-500 text-xs font-medium uppercase tracking-wider">
                        <category.icon className="h-4 w-4" />
                        <span>{category.name}</span>
                      </div>
                      
                      {/* Category Items */}
                      <div className="space-y-1">
                        {category.items.map((item) => renderNavigationItem(item))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results Message */}
              {searchQuery.trim() && filteredItems.length === 0 && (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No navigation items found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="text-center">
                <div className="w-8 h-8 bg-wendys-red rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <p className="text-xs text-gray-500">Dashboard v3.0</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Desktop sidebar (existing code)
    return (
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
            
            {searchQuery.trim() ? (
              // Search mode - show flat list
              <div className="space-y-1">
                {filteredItems.map((item) => renderNavigationItem(item, true))}
              </div>
            ) : (
              // Normal mode - show categorized with collapsible sections
              <div className="space-y-4">
                {navigationCategories.map((category) => {
                  const isExpanded = expandedCategories.has(category.id)
                  
                  return (
                    <div key={category.id} className="space-y-2">
                      {/* Category Header - Only show when expanded */}
                      {open && (
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="flex items-center space-x-2 text-gray-500 text-xs font-medium uppercase tracking-wider hover:text-gray-700 transition-colors w-full text-left"
                        >
                          <category.icon className="h-4 w-4" />
                          <span className="flex-1">{category.name}</span>
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </button>
                      )}
                      
                      {/* Category Items */}
                      {isExpanded && (
                        <div className="space-y-1">
                          {category.items.map((item) => renderNavigationItem(item))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

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
    )
  }
)

RightNavDrawer.displayName = "RightNavDrawer"