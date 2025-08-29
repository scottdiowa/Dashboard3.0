import React from 'react'
import { cn } from '@/lib/utils'

interface Column {
  key: string
  label: string
  className?: string
  render?: (value: any, row: any) => React.ReactNode
}

interface MobileResponsiveTableProps {
  columns: Column[]
  data: any[]
  mobileCardRender?: (row: any) => React.ReactNode
  className?: string
  emptyMessage?: string
  loading?: boolean
}

export function MobileResponsiveTable({ 
  columns, 
  data, 
  mobileCardRender,
  className, 
  emptyMessage = "No data available",
  loading = false 
}: MobileResponsiveTableProps) {
  if (loading) {
    return <TableSkeleton columns={columns} />
  }

  const defaultCardRender = (row: any) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
      {columns.map((column) => (
        <div key={column.key} className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">{column.label}:</span>
          <span className="text-sm">
            {column.render 
              ? column.render(row[column.key], row)
              : row[column.key]
            }
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <>
      {/* Desktop Table View */}
      <div className={cn("hidden md:block", className)}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {columns.map((column) => (
                  <th key={column.key} className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-8 px-4 text-center text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={row.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={column.key} className={cn("py-3 px-4 text-sm", column.className)}>
                        {column.render 
                          ? column.render(row[column.key], row)
                          : row[column.key]
                        }
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        <div className="space-y-4">
          {data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            data.map((row, index) => (
              <div key={row.id || index}>
                {mobileCardRender ? mobileCardRender(row) : defaultCardRender(row)}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

function TableSkeleton({ columns }: { columns: Column[] }) {
  return (
    <div className="animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((column) => (
                <th key={column.key} className="py-3 px-4">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(3)].map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100">
                {columns.map((column) => (
                  <td key={column.key} className="py-3 px-4">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


