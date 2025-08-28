import { Star, CheckCircle, AlertTriangle } from 'lucide-react'

// TODO: Replace with real data from Supabase
const mockSmgData = {
  osat: 0,
  accuracyOfOrder: 0,
  zoneOfDefection: 0,
  customerComputers: 0,
  tasteOfFood: 0,
  totalEntries: 0
}

export function SmgSnapshot() {
  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600'
    if (score >= 4.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 4.5) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (score >= 4.0) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <AlertTriangle className="h-4 w-4 text-red-600" />
  }

  return (
    <div className="wendys-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-wendys-charcoal">
          SMG Snapshot (Current Month)
        </h3>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Star className="h-4 w-4 text-yellow-500" />
          <span>{mockSmgData.totalEntries} entries</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* OSAT Score */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Star className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-medium text-wendys-charcoal">OSAT Score</p>
              <p className="text-sm text-gray-600">Overall satisfaction</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getScoreIcon(mockSmgData.osat)}
            <span className={cn("text-xl font-bold", getScoreColor(mockSmgData.osat))}>
              {mockSmgData.osat.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Accuracy of Order */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-wendys-charcoal">Accuracy of Order</p>
              <p className="text-sm text-gray-600">Order accuracy rating</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getScoreIcon(mockSmgData.accuracyOfOrder)}
            <span className={cn("text-xl font-bold", getScoreColor(mockSmgData.accuracyOfOrder))}>
              {mockSmgData.accuracyOfOrder.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Zone of Defection */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-wendys-charcoal">Zone of Defection</p>
              <p className="text-sm text-gray-600">Customer dissatisfaction</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getScoreIcon(mockSmgData.zoneOfDefection)}
            <span className={cn("text-xl font-bold", getScoreColor(mockSmgData.zoneOfDefection))}>
              {mockSmgData.zoneOfDefection.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Customer Computers */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-wendys-charcoal">Customer Computers</p>
              <p className="text-sm text-gray-600">Computer system rating</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getScoreIcon(mockSmgData.customerComputers)}
            <span className={cn("text-xl font-bold", getScoreColor(mockSmgData.customerComputers))}>
              {mockSmgData.customerComputers.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Taste of Food */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Star className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-medium text-wendys-charcoal">Taste of Food</p>
              <p className="text-sm text-gray-600">Food quality rating</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getScoreIcon(mockSmgData.tasteOfFood)}
            <span className={cn("text-xl font-bold", getScoreColor(mockSmgData.tasteOfFood))}>
              {mockSmgData.tasteOfFood.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
