/**
 * YouTube Data API Service
 * Requires a VITE_YOUTUBE_API_KEY in .env
 */

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeTrack {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
}

export const youtubeService = {
  async search(query: string, apiKey: string): Promise<YouTubeTrack[]> {
    if (!apiKey) {
      console.warn('YouTube API Key missing');
      return [];
    }

    try {
      const response = await fetch(
        `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(
          query + ' music'
        )}&type=video&videoCategoryId=10&maxResults=20&key=${apiKey}`
      );

      if (!response.ok) throw new Error('YouTube API request failed');

      const data = await response.json();
      
      return data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high.url,
      }));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  async getTrackDetails(videoId: string, apiKey: string): Promise<any> {
    const response = await fetch(
      `${BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
    );
    return response.json();
  }
};
