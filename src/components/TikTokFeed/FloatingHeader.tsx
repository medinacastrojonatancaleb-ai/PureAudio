import React from 'react';
import { Search, Play, Pause, MoreHorizontal } from 'lucide-react';

interface FloatingHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  songTitle: string;
  artist: string;
  coverUrl: string;
  isPlaying: boolean;
  togglePlay: () => void;
  onNextClick: () => void;
}

export const FloatingHeader: React.FC<FloatingHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  songTitle,
  artist,
  coverUrl,
  isPlaying,
  togglePlay,
  onNextClick,
}) => {
  return (
    <div className="floating-music-hud pointer-events-auto flex justify-center items-center py-4 px-4">
      
      {/* Search capsule centered */}
      <div className="w-full max-w-[420px] flex items-center justify-between bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 hover:border-white/20 transition-all select-none shadow-xl">
        <input
          type="text"
          placeholder="Buscar canciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-0 text-[11px] text-white placeholder:text-gray-400 focus:outline-none focus:ring-0 w-full font-sans font-semibold pr-2"
        />
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[9px] text-[#00df82] hover:text-white uppercase font-sans font-black tracking-wider cursor-pointer bg-transparent border-0"
            >
              Borrar
            </button>
          )}
          <div className="h-3 w-px bg-white/15" />
          <Search size={12} className="text-[#00df82] cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>

    </div>
  );
};

