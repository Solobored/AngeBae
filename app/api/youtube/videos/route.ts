import { type NextRequest, NextResponse } from "next/server"

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const maxResults = searchParams.get("maxResults") || "12"

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 })
  }

  try {
    let url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&type=video&part=snippet&maxResults=${maxResults}`

    if (query) {
      url += `&q=${encodeURIComponent(query + " skincare tutorial")}`
    } else if (CHANNEL_ID) {
      url += `&channelId=${CHANNEL_ID}`
    } else {
      url += `&q=skincare+tutorial+beauty`
    }

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch videos")
    }

    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }))

    return NextResponse.json({ videos, total: data.pageInfo.totalResults })
  } catch (error) {
    console.error("YouTube API error:", error)
    return NextResponse.json({ error: "Failed to fetch YouTube videos" }, { status: 500 })
  }
}
