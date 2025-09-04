import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Video, Settings as SettingsIcon, Monitor, Palette, Database } from 'lucide-react'
import { VideoManager } from '@/components/overview/VideoManager'
import { type VideoFile } from '@/lib/video-manager'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const [selectedVideo, setSelectedVideo] = useState<string>('banner-video.mp4')
  const [availableVideos, setAvailableVideos] = useState<VideoFile[]>([])

  // Load saved video selection from localStorage
  useEffect(() => {
    const savedVideo = localStorage.getItem('banner-video-selection')
    if (savedVideo) {
      setSelectedVideo(savedVideo)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-wendys-red" />
        <div>
          <h1 className="text-2xl font-bold text-wendys-charcoal">Settings</h1>
          <p className="text-gray-600">Configure your dashboard preferences and appearance</p>
        </div>
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
    </div>
  )
}
