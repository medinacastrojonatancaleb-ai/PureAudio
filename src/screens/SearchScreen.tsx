import React, { useState, useEffect } from 'react';
import { Search, X, Mic, Music, User, Disc, Play, Heart, MoreVertical, UserPlus, UserCheck } from 'lucide-react';
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
  const [error, setError] = useState<'general' | null>(null);
  const { 
    playTrack, 
    currentTrack, 
    toggleLike, 
    likedTracks, 
    followedArtists, 
    toggleFollowArtist,
    t
  } = usePlayer();

  const handleSearch = async (term: string) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) {
      setResults([]);
      setError(null);
      return;
    }
    
    setIsSearching(true);
    setError(null);
    console.log('[SearchScreen] Initiating search for:', trimmedTerm);
    
    try {
      const tracks = await youtubeService.search(trimmedTerm);
      console.log('[SearchScreen] Search successful, found tracks:', tracks.length);
      setResults(tracks);
    } catch (err: any) {
      console.error('[SearchScreen] Search execution failed:', err);
      setError('general');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
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
      <div className="sticky top-[-20px] bg-background/80 backdrop-blur-md pt-4 pb-4 z-20 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-outline/10">
        <div className="flex items-center gap-3 bg-surfaceVariant/60 hover:bg-surfaceVariant transition-colors rounded-full px-5 py-3 border border-outline/30">
          <Search size={20} className="text-gray-400" />
          <input 
            type="text" 
            placeholder={t('search_placeholder')} 
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
            <p className="text-xs font-bold uppercase tracking-widest text-primary">{t('searching')}</p>
          </motion.div>
        ) : error === 'general' ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-4"
          >
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center text-error">
               <Music size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-black">{t('something_wrong')}</p>
              <p className="text-sm text-gray-400">Please try again later or check your internet connection.</p>
            </div>
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5"
          >
            {results.map((track) => {
              const isLiked = likedTracks.some(t => t.id === track.id);
              const isFollowing = followedArtists.some(a => a.name === track.artist);
              return (
                <motion.div 
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  key={track.id} 
                  onClick={() => playTrack(track, results)}
                  className={`flex flex-col p-3 rounded-[24px] bg-surfaceVariant/30 hover:bg-surfaceVariant/80 border border-outline/30 transition-all cursor-pointer group relative overflow-hidden ${currentTrack?.id === track.id ? 'bg-surfaceVariant border-primary/20 shadow-lg' : ''}`}
                >
                  <div className="relative aspect-square w-full rounded-[18px] overflow-hidden mb-3 shadow bg-black/10">
                    <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center text-black shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <Play size={20} fill="currentColor" className="ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-0.5">
                      <h3 className={`font-bold text-sm truncate leading-snug group-hover:text-primary transition-colors ${currentTrack?.id === track.id ? 'text-primary' : 'text-white'}`}>{track.title}</h3>
                      <p className="text-xs text-onSurfaceVariant/80 truncate font-semibold">{track.artist}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3 gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollowArtist({
                            id: '',
                            name: track.artist,
                            thumbnail: track.thumbnail
                          });
                        }}
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full transition-all flex items-center gap-1 min-w-0 truncate ${isFollowing ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-black/20 text-gray-400 hover:text-white border border-outline/30'}`}
                      >
                        {isFollowing ? <UserCheck size={10} /> : <UserPlus size={10} />}
                        <span className="truncate">{isFollowing ? t('following') : t('follow_artist')}</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                        className={`p-1.5 rounded-full bg-black/20 hover:bg-black/40 border border-outline/10 text-gray-400 hover:text-primary transition-colors ${isLiked ? 'text-primary' : ''}`}
                      >
                        <Heart size={13} fill={isLiked ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : query ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-4"
          >
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-500">
               <Search size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-black">{t('no_results')} "{query}"</p>
              <p className="text-sm text-gray-400">{t('check_spelling')}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Categories Grid */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight">{t('browse_all')}</h2>
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
