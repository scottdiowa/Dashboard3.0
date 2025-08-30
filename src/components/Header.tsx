import { format } from 'date-fns'
import { Menu, User, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface HeaderProps {
  user: any
  onNavToggle: () => void
  navOpen: boolean
}

export function Header({ user, onNavToggle, navOpen }: HeaderProps) {
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavToggle}
            className="tap p-2 hover:bg-gray-100"
            aria-label={navOpen ? "Close navigation" : "Open navigation"}
          >
            <Menu className="h-5 w-5 text-wendys-charcoal" />
          </Button>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-wendys-red rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-xl">W</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-wendys-charcoal">
                <span className="hidden sm:inline">SE 14th GM Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hide-on-mobile">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 tap">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">{user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
