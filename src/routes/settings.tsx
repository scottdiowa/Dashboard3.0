import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Video, Settings as SettingsIcon, Monitor, Palette, Database, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { VideoManager } from '@/components/overview/VideoManager'
import { type VideoFile } from '@/lib/video-manager'
import { SettingsPasswordProtection } from '@/components/SettingsPasswordProtection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const [selectedVideo, setSelectedVideo] = useState<string>('banner-video.mp4')
  const [availableVideos, setAvailableVideos] = useState<VideoFile[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [settingsPassword, setSettingsPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const { toast } = useToast()

  // Load saved video selection and settings password from localStorage
  useEffect(() => {
    const savedVideo = localStorage.getItem('banner-video-selection')
    if (savedVideo) {
      setSelectedVideo(savedVideo)
    }
    
    const savedPassword = localStorage.getItem('settings-password')
    if (savedPassword) {
      setSettingsPassword(savedPassword)
    } else {
      // Set default password if none exists
      const defaultPassword = 'admin123'
      setSettingsPassword(defaultPassword)
      localStorage.setItem('settings-password', defaultPassword)
    }
  }, [])

  // Save video selection to localStorage
  const handleVideoChange = (videoValue: string) => {
    setSelectedVideo(videoValue)
    localStorage.setItem('banner-video-selection', videoValue)
  }

  // Handle video list updates from VideoManager
  const handleVideosUpdate = (videos: VideoFile[]) => {
    setAvailableVideos(videos)
    
    // If current selection is no longer available, switch to first video
    if (!videos.some(v => v.value === selectedVideo) && videos.length > 0) {
      const newSelection = videos[0].value
      setSelectedVideo(newSelection)
      localStorage.setItem('banner-video-selection', newSelection)
    }
  }

  // Handle authentication
  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }

  // Handle password change
  const handlePasswordChange = (newPassword: string) => {
    setSettingsPassword(newPassword)
    localStorage.setItem('settings-password', newPassword)
  }

  // Handle password change within settings
  const handlePasswordUpdate = () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    
    if (newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters long.')
      return
    }

    setSettingsPassword(newPassword)
    localStorage.setItem('settings-password', newPassword)
    setNewPassword('')
    setConfirmPassword('')
    setIsChangingPassword(false)
    setPasswordError('')
    toast({
      title: "Password Updated",
      description: "Settings password has been changed successfully.",
    })
  }

  // Show password protection if not authenticated
  if (!isAuthenticated) {
    return (
      <SettingsPasswordProtection
        onAuthenticated={handleAuthenticated}
        onPasswordChange={handlePasswordChange}
        currentPassword={settingsPassword}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-wendys-red" />
          <div>
            <h1 className="text-2xl font-bold text-wendys-charcoal">Settings</h1>
            <p className="text-gray-600">Configure your dashboard preferences and appearance</p>
          </div>
        </div>
        <Button
          onClick={() => setIsAuthenticated(false)}
          variant="outline"
          className="text-wendys-red border-wendys-red hover:bg-wendys-red hover:text-white"
        >
          Lock Settings
        </Button>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Video Settings */}
        <div className="lg:col-span-2">
          <div className="wendys-card">
            <div className="flex items-center gap-2 mb-4">
              <Video className="h-5 w-5 text-wendys-red" />
              <h2 className="text-lg font-semibold text-wendys-charcoal">Banner Video Settings</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Manage your banner videos for the overview page. Upload new videos, delete unwanted ones, and preview them before selecting.
            </p>
            
            <VideoManager
              selectedVideo={selectedVideo}
              onVideoChange={handleVideoChange}
              onVideosUpdate={handleVideosUpdate}
            />
          </div>
        </div>

        {/* Quick Settings Panel */}
        <div className="space-y-6">
          
          {/* Current Video Preview */}
          <div className="wendys-card">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="h-5 w-5 text-wendys-red" />
              <h3 className="text-lg font-semibold text-wendys-charcoal">Current Video</h3>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-medium text-gray-700">Selected Video:</p>
                <p className="text-gray-600">
                  {availableVideos.find(v => v.value === selectedVideo)?.label || selectedVideo}
                </p>
              </div>
              
              <div className="rounded-lg overflow-hidden">
                <video 
                  key={selectedVideo}
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-32 object-cover"
                >
                  <source src={`/${selectedVideo}`} type="video/mp4" />
                  <p>Your browser does not support the video tag.</p>
                </video>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="wendys-card">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-wendys-red" />
              <h3 className="text-lg font-semibold text-wendys-charcoal">Quick Actions</h3>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Video Management:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Upload new videos (MP4, WebM, AVI, MOV, MKV)</li>
                  <li>• Preview videos before selecting</li>
                  <li>• Delete unwanted videos</li>
                  <li>• Reset to default videos</li>
                </ul>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="wendys-card">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-wendys-red" />
              <h3 className="text-lg font-semibold text-wendys-charcoal">System Info</h3>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Videos:</span>
                <span className="font-medium">{availableVideos.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selected Video:</span>
                <span className="font-medium text-xs truncate max-w-32">
                  {selectedVideo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Storage:</span>
                <span className="font-medium">Local</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Password Management */}
        <div className="wendys-card">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-wendys-red" />
            <h3 className="text-lg font-semibold text-wendys-charcoal">Password Management</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Change the password required to access the settings page.
          </p>
          
          {!isChangingPassword ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-500">
                <p>• Current password is set and active</p>
                <p>• Password protects access to all settings</p>
                <p>• Click below to change the password</p>
              </div>
              <Button
                onClick={() => setIsChangingPassword(true)}
                className="wendys-button"
              >
                Change Password
              </Button>
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

              {passwordError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handlePasswordUpdate}
                  className="flex-1 wendys-button"
                  disabled={!newPassword.trim() || !confirmPassword.trim()}
                >
                  Update Password
                </Button>
                <Button
                  onClick={() => {
                    setIsChangingPassword(false)
                    setPasswordError('')
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

        {/* Appearance Settings */}
        <div className="wendys-card">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-wendys-red" />
            <h3 className="text-lg font-semibold text-wendys-charcoal">Appearance</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Customize the look and feel of your dashboard.
          </p>
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              <p>• Theme customization (coming soon)</p>
              <p>• Color scheme options (coming soon)</p>
              <p>• Layout preferences (coming soon)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Settings */}
      <div className="wendys-card">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-wendys-red" />
          <h3 className="text-lg font-semibold text-wendys-charcoal">Data Management</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Manage your data and storage preferences.
        </p>
        <div className="space-y-3">
          <div className="text-sm text-gray-500">
            <p>• Data export options (coming soon)</p>
            <p>• Backup and restore (coming soon)</p>
            <p>• Cache management (coming soon)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
