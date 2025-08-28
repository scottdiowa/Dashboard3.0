import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const drawerVariants = cva(
  'fixed inset-y-0 z-50 flex flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out',
  {
    variants: {
      side: {
        left: 'left-0 border-r',
        right: 'right-0 border-l',
      },
      size: {
        sm: 'w-80',
        md: 'w-96',
        lg: 'w-[32rem]',
        xl: 'w-[40rem]',
        full: 'w-full',
      },
    },
    defaultVariants: {
      side: 'right',
      size: 'lg',
    },
  }
)

interface DrawerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof drawerVariants> {
  open?: boolean
  onClose?: () => void
}

export function Drawer({ 
  children, 
  className, 
  open = false, 
  onClose, 
  side, 
  size, 
  ...props 
}: DrawerProps) {
  const [isOpen, setIsOpen] = React.useState(open)

  React.useEffect(() => {
    setIsOpen(open)
  }, [open])

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={cn(
          drawerVariants({ side, size }),
          isOpen 
            ? 'translate-x-0' 
            : side === 'left' 
              ? '-translate-x-full' 
              : 'translate-x-full',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  )
}

interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DrawerHeader({ children, className, ...props }: DrawerHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-6 border-b border-gray-200 shrink-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface DrawerTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function DrawerTitle({ children, className, ...props }: DrawerTitleProps) {
  return (
    <h2
      className={cn('text-xl font-semibold text-wendys-charcoal', className)}
      {...props}
    >
      {children}
    </h2>
  )
}

interface DrawerCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClose?: () => void
}

export function DrawerClose({ onClose, className, ...props }: DrawerCloseProps) {
  return (
    <button
      className={cn(
        'rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none p-2',
        className
      )}
      onClick={onClose}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  )
}

interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DrawerContent({ children, className, ...props }: DrawerContentProps) {
  return (
    <div
      className={cn('flex-1 overflow-y-auto p-6', className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface DrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DrawerFooter({ children, className, ...props }: DrawerFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 p-6 border-t border-gray-200 shrink-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
