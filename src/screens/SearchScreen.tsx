import React, { useState, useEffect } from 'react';
import { Search, X, Mic, Music, User, Disc, Play, Heart, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { youtubeService, YouTubeTrack } from '../services/youtubeService';
import { usePlayer } from '../context/PlayerContext';

const CATEGORIES = [
  { name: 'Pop', color: 'bg-primary' },
  { name: 'Rock', color: 'bg-secondary' },
  { name: 'Hip Hop', color: 'bg-tertiary' },
  { name: 'Jazz', color: 'bg-outline' },
  { name: 'Electronic', color: 'bg-error' },
  { name: 'Classical', color: 'bg-onSurfaceVariant' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { playTrack, currentTrack, toggleLike, likedTracks, getLikeCount } = usePlayer();
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    const tracks = await youtubeService.search(term, apiKey);
    setResults(tracks);
    setIsSearching(false);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) handleSearch(query);
      else setResults([]);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="space-y-6 pb-20">
      {/* Search Input */}
      <div className="sticky top-[-20px] bg-black/40 backdrop-blur-md pt-4 pb-4 z-20 -mx-6 px-6">
        <div className="flex items-center gap-3 bg-[#242424] hover:bg-[#2a2a2a] transition-colors rounded-full px-5 py-3 border border-white/5">
          <Search size={20} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="What do you want to listen to?" 
            className="flex-1 bg-transparent border-none outline-none text-white text-sm font-medium placeholder:text-gray-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={18} className="text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Searching...</p>
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {results.map((track) => {
              const isLiked = likedTracks.some(t => t.id === track.id);
              return (
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  key={track.id} 
                  onClick={() => playTrack(track, results)}
                  className={`flex items-center gap-4 p-2 rounded-lg transition-all cursor-pointer group bg-white/[0.03] hover:bg-white/[0.08] ${currentTrack?.id === track.id ? 'bg-primary/10' : ''}`}
                >
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <img src={track.thumbnail} alt={track.title} className="w-full h-full rounded shadow-md object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play size={16} className="text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-sm truncate leading-tight">{track.title}</h3>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                    className={`p-2 transition-colors opacity-0 group-hover:opacity-100 ${isLiked ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Categories Grid */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight">Browse all</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {CATEGORIES.map((cat) => (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    key={cat.name}
                    onClick={() => setQuery(cat.name)}
                    className={`${cat.color} h-40 rounded-xl p-4 relative overflow-hidden group cursor-pointer shadow-xl`}
                  >
                    <span className="text-white font-black text-xl leading-tight relative z-10">{cat.name}</span>
                    <Disc size={80} className="absolute -right-4 -bottom-4 text-white/20 transform group-hover:rotate-45 transition-transform duration-700" />
                  </motion.div>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
