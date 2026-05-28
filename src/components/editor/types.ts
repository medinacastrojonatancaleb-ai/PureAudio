export interface VideoFilter {
  id: string;
  name: string;
  cssClass: string;
  glow: string;
}

export interface DragElement {
  id: string | number;
  type: 'video' | 'text' | 'music' | 'sticker';
  text?: string;
  symbol?: string; // for stickers
  x: number; // percentage width position (0-100)
  y: number; // percentage height position (0-100)
  scale: number;
  rotation: number; // in degrees
  color?: string;
  fontFamily?: string;
  opacity: number;
  animation?: 'none' | 'fade' | 'pop' | 'zoom' | 'slide' | 'blur';
}

export interface MusicItem {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  volume: number;
  trimStart: number;
  trimEnd: number;
  fadeIn: number;
  fadeOut: number;
}
