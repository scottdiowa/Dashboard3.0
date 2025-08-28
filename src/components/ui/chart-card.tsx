import React from 'react'
import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: string
  subtitle?: string
  className?: string
  children: React.ReactNode
  loading?: boolean
  error?: string
  onRefresh?: () => void
}

export function ChartCard({ 
  title, 
  subtitle, 
  className, 
  children, 
  loading = false,
  error,
  onRefresh 
}: ChartCardProps) {
  return (
    <div className={cn("wendys-card", className)}>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-wendys-charcoal">{title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Refresh chart"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {error ? (
        <div className="flex items-center justify-center h-[300px] text-red-500">
          <div className="text-center">
            <p className="text-sm font-medium">Error loading chart</p>
            <p className="text-xs mt-1 text-red-400">{error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-2 px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      ) : loading ? (
        <ChartSkeleton />
      ) : (
        children
      )}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[300px] bg-gray-100 rounded flex flex-col justify-end p-4">
        {/* Y-axis labels */}
        <div className="absolute left-2 top-4 space-y-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-8 h-2 bg-gray-200 rounded" />
          ))}
        </div>
        
        {/* Chart bars/lines simulation */}
        <div className="flex items-end justify-between h-48 mb-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-t"
              style={{
                height: `${Math.random() * 80 + 20}%`,
                width: '6%'
              }}
            />
          ))}
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-12 h-2 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
