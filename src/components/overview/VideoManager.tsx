import { useState, useEffect, useRef } from 'react'
import { Video, Settings, Upload, Trash2, Eye, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  addVideo, 
  removeVideo, 
  validateVideoFile, 
  formatFileSize, 
  createVideoFromFile,
  getVideoMetadata,
  cleanupDuplicateVideos,
  resetVideosToDefaults,
  type VideoFile 
} from '@/lib/video-manager'

interface VideoManagerProps {
  selectedVideo: string
  onVideoChange: (video: string) => void
  onVideosUpdate: (videos: VideoFile[]) => void
}

export function VideoManager({ selectedVideo, onVideoChange, onVideosUpdate }: VideoManagerProps) {
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showManager, setShowManager] = useState(false)
  const [previewVideo, setPreviewVideo] = useState<string | null>(null)
  const [videoMetadata, setVideoMetadata] = useState<{[key: string]: any}>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load available videos from localStorage
  const loadVideos = async () => {
    try {
      // Clean up any duplicates first
      const availableVideos = cleanupDuplicateVideos()
      setVideos(availableVideos)
      onVideosUpdate(availableVideos)
      
      // Load metadata for each video
      const metadata: {[key: string]: any} = {}
      for (const video of availableVideos) {
        const meta = await getVideoMetadata(video.value)
        if (meta) {
          metadata[video.value] = meta
        }
      }
      setVideoMetadata(metadata)
    } catch (error) {
      console.error('Error loading videos:', error)
      toast({
        title: "Error",
        description: "Failed to load video list",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadVideos()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateVideoFile(file)
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Create video object from file
      const newVideo = createVideoFromFile(file)
      
      // Add to the list
      const updatedVideos = addVideo(newVideo)
      setVideos(updatedVideos)
      onVideosUpdate(updatedVideos)

      // Load metadata for the new video
      const meta = await getVideoMetadata(newVideo.value)
      if (meta) {
        setVideoMetadata(prev => ({ ...prev, [newVideo.value]: meta }))
      }

      toast({
        title: "Success",
        description: `Video "${newVideo.label}" added successfully. Note: In a production app, this would upload to a server.`,
      })

      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to add video file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteVideo = (videoValue: string) => {
    if (videoValue === selectedVideo) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete the currently selected video",
        variant: "destructive",
      })
      return
    }

    const videoToDelete = videos.find(v => v.value === videoValue)
    if (!videoToDelete) return

    if (window.confirm(`Are you sure you want to delete "${videoToDelete.label}"?`)) {
      const updatedVideos = removeVideo(videoValue)
      setVideos(updatedVideos)
      onVideosUpdate(updatedVideos)

      // Remove metadata
      setVideoMetadata(prev => {
        const newMeta = { ...prev }
        delete newMeta[videoValue]
        return newMeta
      })

      toast({
        title: "Deleted",
        description: `Video "${videoToDelete.label}" has been removed`,
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Video Selection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-wendys-red" />
          <h3 className="text-lg font-semibold text-wendys-charcoal">Banner Video</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManager(!showManager)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Manage Videos
          </Button>
          <Select value={selectedVideo} onValueChange={onVideoChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select video" />
            </SelectTrigger>
            <SelectContent>
              {videos.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Video Manager Panel */}
      {showManager && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-wendys-charcoal">Video Management</h4>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('Reset all videos to defaults? This will remove any custom videos you\'ve added.')) {
                    const defaultVideos = resetVideosToDefaults()
                    setVideos(defaultVideos)
                    onVideosUpdate(defaultVideos)
                    toast({
                      title: "Reset Complete",
                      description: "Videos have been reset to defaults",
                    })
                  }
                }}
                className="text-xs"
              >
                Reset to Defaults
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManager(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Upload a new video file</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Choose Video File'}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: MP4, WebM, AVI. Max size: 50MB
              </p>
            </div>
          </div>

          {/* Video List */}
          <div className="space-y-2">
            <h5 className="font-medium text-wendys-charcoal">Available Videos</h5>
            <div className="space-y-2">
              {videos.map((video) => (
                <div
                  key={video.value}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Video className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{video.label}</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>
                          {video.size ? formatFileSize(video.size) : 'Unknown size'}
                          {video.lastModified && ` • ${video.lastModified.toLocaleDateString()}`}
                        </p>
                        {videoMetadata[video.value] && (
                          <p>
                            {videoMetadata[video.value].width}x{videoMetadata[video.value].height} • 
                            {Math.round(videoMetadata[video.value].duration)}s
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewVideo(video.value)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVideo(video.value)}
                      disabled={video.value === selectedVideo}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-wendys-charcoal">Video Preview</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewVideo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <video
              src={`/${previewVideo}`}
              controls
              className="w-full rounded-lg"
              style={{ maxHeight: '60vh' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  )
}
