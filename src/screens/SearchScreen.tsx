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
  const apiKey = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

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
    <div className="space-y-6">
      {/* Search Input */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md pt-2 pb-4 z-10">
        <div className="m3-input rounded-3xl flex items-center gap-3 bg-surfaceVariant/40 border-none shadow-inner">
          <Search size={22} className="text-onSurfaceVariant" />
          <input 
            type="text" 
            placeholder="Search millions of songs..." 
            className="flex-1 bg-transparent border-none outline-none text-onSurface font-bold placeholder:text-onSurfaceVariant/50"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={20} className="text-onSurfaceVariant" />
            </button>
          )}
          <Mic size={22} className="text-primary" />
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
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-primary">Searching YouTube...</p>
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {results.map((track) => {
              const isLiked = likedTracks.some(t => t.id === track.id);
              return (
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  key={track.id} 
                  onClick={() => playTrack(track, results)}
                  className={`flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer group ${currentTrack?.id === track.id ? 'bg-primary/10' : 'hover:bg-surfaceVariant/60'}`}
                >
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <img src={track.thumbnail} alt={track.title} className="w-full h-full rounded-xl object-cover shadow-md" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                      <Play size={20} className="text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-black text-sm truncate text-onSurface leading-tight">{track.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-bold text-onSurfaceVariant/70 truncate uppercase tracking-tight">{track.artist}</p>
                      <div className="flex items-center gap-0.5 text-primary">
                        <Heart size={10} fill={isLiked ? "currentColor" : "none"} />
                        <span className="text-[9px] font-black">{getLikeCount(track.id)}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                    className={`p-2 transition-colors ${isLiked ? 'text-primary' : 'text-onSurfaceVariant hover:text-primary'}`}
                  >
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
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
              <h2 className="text-xl font-black tracking-tight">Explore Genres</h2>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    key={cat.name}
                    onClick={() => setQuery(cat.name)}
                    className={`${cat.color} h-28 rounded-3xl p-5 relative overflow-hidden group cursor-pointer shadow-lg shadow-black/5`}
                  >
                    <span className="text-white font-black text-xl relative z-10">{cat.name}</span>
                    <Disc size={80} className="absolute -right-6 -bottom-6 text-white/10 transform group-hover:rotate-45 transition-transform duration-700" />
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Popular Searches */}
            <section className="space-y-4">
              <h2 className="text-xl font-black tracking-tight">Popular right now</h2>
              <div className="flex flex-wrap gap-2">
                {['Lofi Hip Hop', 'Chill Mix', 'Top Hits 2024', 'Piano Solo', 'Reggaeton'].map((term) => (
                  <button 
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-5 py-2.5 bg-surfaceVariant/50 border border-outline/10 rounded-full text-xs font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
