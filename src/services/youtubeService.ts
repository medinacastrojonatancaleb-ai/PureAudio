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
  /**
   * Filters a list of video IDs to return only those that are embeddable.
   */
  async filterEmbeddable(videoIds: string[], apiKey: string): Promise<string[]> {
    if (!videoIds.length || !apiKey) return [];
    
    try {
      const response = await fetch(
        `${BASE_URL}/videos?part=status,snippet&id=${videoIds.join(',')}&key=${apiKey}`
      );
      if (!response.ok) return videoIds; // Fallback to all if call fails

      const data = await response.json();
      return data.items
        .filter((item: any) => item.status.embeddable)
        .map((item: any) => item.id);
    } catch (error) {
      console.error('Filter embeddable error:', error);
      return videoIds;
    }
  },

  async search(query: string, apiKey: string): Promise<YouTubeTrack[]> {
    if (!apiKey || apiKey.includes('YOUR_')) {
      console.warn('YouTube API Key is missing or using placeholder value. Please set a valid API key in Settings.');
      return [];
    }

    try {
      const searchResponse = await fetch(
        `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(
          query + ' music'
        )}&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=10&key=${apiKey}`
      );

      if (!searchResponse.ok) throw new Error('YouTube API search failed');

      const searchData = await searchResponse.json();
      const videoIds = searchData.items.map((item: any) => item.id.videoId);
      
      // Secondary check for embeddable status to be sure
      const validIds = await this.filterEmbeddable(videoIds, apiKey);
      
      return searchData.items
        .filter((item: any) => validIds.includes(item.id.videoId))
        .map((item: any) => ({
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

  async getTrending(apiKey: string): Promise<YouTubeTrack[]> {
    if (!apiKey || apiKey.includes('YOUR_')) return [];

    try {
      // Use chart=mostPopular for trending music
      const response = await fetch(
        `${BASE_URL}/videos?part=snippet,status&chart=mostPopular&videoCategoryId=10&maxResults=20&key=${apiKey}`
      );

      if (!response.ok) throw new Error('YouTube API trending failed');

      const data = await response.json();
      
      return data.items
        .filter((item: any) => item.status && item.status.embeddable)
        .map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high.url,
        }));
    } catch (error) {
      console.error('Trending error:', error);
      return [];
    }
  },

  async getPlayableTracks(query: string, apiKey: string): Promise<YouTubeTrack[]> {
    if (!apiKey || apiKey.includes('YOUR_')) return [];
    
    try {
      const tracks = await this.search(query, apiKey);
      // search already filters for embeddable in my new implementation
      return tracks;
    } catch (error) {
      console.error('getPlayableTracks error:', error);
      return [];
    }
  },

  async getTrackDetails(videoId: string, apiKey: string): Promise<any> {
    const response = await fetch(
      `${BASE_URL}/videos?part=snippet,contentDetails,statistics,status&id=${videoId}&key=${apiKey}`
    );
    return response.json();
  }
};
