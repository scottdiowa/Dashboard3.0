// Video management utilities
// Note: In a production app, these operations would be handled by a backend API

export interface VideoFile {
  value: string
  label: string
  size?: number
  lastModified?: Date
  type?: string
}

// Default video files that are available in the public directory
export const DEFAULT_VIDEOS: VideoFile[] = [
  { value: 'banner-video.mp4', label: 'Banner Video (Original)' },
  { value: 'banner-video (2).mp4', label: 'Banner Video 2' },
  { value: 'video-banner.mp4', label: 'Video Banner' },
  { value: 'dashboard-8_30_2025, 8_58 PM.mp4', label: 'Dashboard Demo' },
]

// Get available videos from localStorage or return defaults
export function getAvailableVideos(): VideoFile[] {
  try {
    const stored = localStorage.getItem('available-videos')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.map((video: any) => ({
        ...video,
        lastModified: video.lastModified ? new Date(video.lastModified) : undefined
      }))
    }
  } catch (error) {
    console.error('Error loading videos from localStorage:', error)
  }
  return DEFAULT_VIDEOS
}

// Save videos to localStorage
export function saveAvailableVideos(videos: VideoFile[]): void {
  try {
    localStorage.setItem('available-videos', JSON.stringify(videos))
  } catch (error) {
    console.error('Error saving videos to localStorage:', error)
  }
}

// Add a new video to the list
export function addVideo(video: VideoFile): VideoFile[] {
  const currentVideos = getAvailableVideos()
  const updatedVideos = [...currentVideos, video]
  saveAvailableVideos(updatedVideos)
  return updatedVideos
}

// Remove a video from the list
export function removeVideo(videoValue: string): VideoFile[] {
  const currentVideos = getAvailableVideos()
  const updatedVideos = currentVideos.filter(v => v.value !== videoValue)
  saveAvailableVideos(updatedVideos)
  return updatedVideos
}

// Validate video file
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('video/')) {
    return { valid: false, error: 'Please select a video file' }
  }

  // Check file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: 'Video file must be less than 50MB' }
  }

  // Check file extension
  const allowedExtensions = ['.mp4', '.webm', '.avi', '.mov', '.mkv']
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!allowedExtensions.includes(fileExtension)) {
    return { valid: false, error: 'Unsupported video format. Please use MP4, WebM, AVI, MOV, or MKV' }
  }

  return { valid: true }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// Create a video object from a file
export function createVideoFromFile(file: File): VideoFile {
  return {
    value: file.name,
    label: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
    size: file.size,
    lastModified: new Date(file.lastModified),
    type: file.type
  }
}

// Check if a video file exists in the public directory
export function checkVideoExists(videoValue: string): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.onloadeddata = () => resolve(true)
    video.onerror = () => resolve(false)
    video.src = `/${videoValue}`
  })
}

// Get video metadata
export function getVideoMetadata(videoValue: string): Promise<{ duration: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      })
    }
    video.onerror = () => resolve(null)
    video.src = `/${videoValue}`
  })
}
