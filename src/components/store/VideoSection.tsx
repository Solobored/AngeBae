"use client"

import { useEffect, useState } from "react"
import { Play } from "lucide-react"

type VideoItem = {
  id: string
  title: string
  description?: string
  thumbnail?: string
  url: string
  channelTitle?: string
}

interface VideoSectionProps {
  slug?: string
  providerName?: string
}

export function VideoSection({ slug, providerName }: VideoSectionProps) {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/api/youtube/videos?maxResults=6")
      .then((res) => (res.ok ? res.json() : { videos: [] }))
      .then((data) => {
        const list = Array.isArray(data.videos) ? data.videos : []
        setVideos(
          list.map((v: { id?: string; videoId?: string; title?: string; description?: string; thumbnail?: string; url?: string; channelTitle?: string }) => ({
            id: v.id || v.videoId || "",
            title: v.title || "Video",
            description: v.description,
            thumbnail: v.thumbnail,
            url: v.url || (v.id ? `https://www.youtube.com/watch?v=${v.id}` : v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : ""),
            channelTitle: v.channelTitle,
          })).filter((v: VideoItem) => v.id && v.url),
        )
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading || (videos.length === 0 && !error)) {
    return null
  }

  if (error || videos.length === 0) {
    return (
      <section className="py-12 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-2xl">🎥</span> Videos
          </h2>
          <p className="text-gray-500 py-4">Próximamente más contenido en video.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">🎥</span> Videos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      </div>
    </section>
  )
}

function VideoCard({ video }: { video: VideoItem }) {
  const [embed, setEmbed] = useState(false)
  const videoId = video.url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1] || video.id

  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-100">
      <div className="aspect-video bg-gray-900 relative">
        {embed && videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <>
            {video.thumbnail && (
              <img
                src={video.thumbnail}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => setEmbed(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
              aria-label="Reproducir"
            >
              <span className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg">
                <Play className="h-8 w-8 ml-1" fill="currentColor" />
              </span>
            </button>
          </>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{video.title}</h3>
        {video.channelTitle && (
          <p className="text-sm text-gray-500 mt-1">{video.channelTitle}</p>
        )}
      </div>
    </div>
  )
}
