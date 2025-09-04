import { useState } from 'react'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface SettingsPasswordProtectionProps {
  onAuthenticated: () => void
  onPasswordChange: (newPassword: string) => void
  currentPassword: string
}

export function SettingsPasswordProtection({ 
  onAuthenticated, 
  onPasswordChange, 
  currentPassword 
}: SettingsPasswordProtectionProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const handleLogin = () => {
    if (password === currentPassword) {
      setError('')
      onAuthenticated()
      toast({
        title: "Access Granted",
        description: "Successfully authenticated to settings.",
      })
    } else {
      setError('Incorrect password. Please try again.')
    }
  }

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long.')
      return
    }

    onPasswordChange(newPassword)
    setNewPassword('')
    setConfirmPassword('')
    setIsChangingPassword(false)
    setError('')
    toast({
      title: "Password Updated",
      description: "Settings password has been changed successfully.",
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isChangingPassword) {
        handlePasswordChange()
      } else {
        handleLogin()
      }
    }
  }

  return (
    <div className="min-h-screen bg-wendys-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="wendys-card">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-wendys-red/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-wendys-red" />
            </div>
            <h1 className="text-2xl font-bold text-wendys-charcoal">
              {isChangingPassword ? 'Change Settings Password' : 'Settings Access'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isChangingPassword 
                ? 'Enter a new password to protect the settings page'
                : 'Enter the settings password to continue'
              }
            </p>
          </div>

          {!isChangingPassword ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-wendys-charcoal font-medium">
                  Settings Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter settings password"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleLogin}
                className="w-full wendys-button"
                disabled={!password.trim()}
              >
                Access Settings
              </Button>

              <div className="text-center">
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="text-sm text-wendys-red hover:text-wendys-red/80 underline"
                >
                  Change Password
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-wendys-charcoal font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    className="pl-10 pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-wendys-charcoal font-medium">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className="pl-10 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handlePasswordChange}
                  className="flex-1 wendys-button"
                  disabled={!newPassword.trim() || !confirmPassword.trim()}
                >
                  Update Password
                </Button>
                <Button
                  onClick={() => {
                    setIsChangingPassword(false)
                    setError('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
