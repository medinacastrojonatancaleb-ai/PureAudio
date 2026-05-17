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

function getApiKey(providedKey: string) {
  const customKey = localStorage.getItem('youtube_api_key');
  if (customKey && customKey.trim()) return customKey.trim();
  return providedKey;
}

export const youtubeService = {
  /**
   * Filters a list of video IDs to return only those that are embeddable.
   * Note: In the new free version, the server already returns playable videos.
   */
  async filterEmbeddable(videoIds: string[], _apiKey?: string): Promise<string[]> {
    return videoIds; 
  },

  async search(query: string, _apiKey?: string): Promise<YouTubeTrack[]> {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Search service error:', error);
      throw error;
    }
  },

  async getTrending(_apiKey?: string): Promise<YouTubeTrack[]> {
    try {
      const response = await fetch('/api/trending');
      if (!response.ok) throw new Error('Trending failed');
      return await response.json();
    } catch (error) {
      console.error('Trending error:', error);
      throw error;
    }
  },

  async getPlayableTracks(query: string, _apiKey?: string): Promise<YouTubeTrack[]> {
    try {
      const response = await fetch(`/api/artist/${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Artist tracks failed');
      return await response.json();
    } catch (error) {
      console.error('getPlayableTracks error:', error);
      throw error;
    }
  },

  async getTrackDetails(videoId: string, _apiKey?: string): Promise<any> {
    // We could implement a proxy for this too if needed, but search often provides enough
    return { id: videoId };
  }
};
