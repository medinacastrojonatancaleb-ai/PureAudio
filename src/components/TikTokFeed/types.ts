export interface FeedItem {
  postId: string;
  songTitle: string;
  artist: string;
  coverUrl: string;
  audioUrl: string; // YouTube Video Video ID
  caption: string;
  likes: number;
  comments: number;
  views: string;
  creatorHandle: string;
  uploadDate: string;
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
}
