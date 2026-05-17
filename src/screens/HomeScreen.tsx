import React, { useEffect, useState } from 'react';
import { Play, Music2, UserPlus, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { usePlayer } from '../context/PlayerContext';
import { youtubeService, YouTubeTrack } from '../services/youtubeService';

export default function HomeScreen() {
  const { 
    playTrack, 
    currentTrack, 
    followedArtists, 
    toggleFollowArtist
  } = usePlayer();
  const [sections, setSections] = useState<{
    greeting: YouTubeTrack[];
    trending: YouTubeTrack[];
    mood: YouTubeTrack[];
  }>({ greeting: [], trending: [], mood: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'general' | null>(null);

  useEffect(() => {
    async function loadData() {
      setError(null);
      try {
        const [kevin, edmaverick, trending] = await Promise.all([
          youtubeService.getPlayableTracks('Kevin Kaarl'),
          youtubeService.getPlayableTracks('Ed Maverick'),
          youtubeService.getTrending(),
        ]);
        
        setSections({
          greeting: [...kevin.slice(0, 3), ...edmaverick.slice(0, 3)],
          trending: trending,
          mood: [...edmaverick.slice(3, 6), ...kevin.slice(3, 5)]
        });
      } catch (err: any) {
        console.error('Home load error:', err);
        setError('general');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6 text-center max-w-lg mx-auto">
        <div className="bg-white/5 p-12 rounded-3xl border border-white/10 space-y-4">
           <Music2 size={48} className="mx-auto text-gray-500 opacity-20" />
           <h1 className="text-xl font-bold">Something went wrong</h1>
           <p className="text-gray-400 text-sm">Failed to load recommendations. Please try again later.</p>
           <button 
             onClick={() => window.location.reload()}
             className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform"
           >
             Retry
           </button>
        </div>
      </div>
    );
  }

  const allTracks = [...sections.greeting, ...sections.trending, ...sections.mood];

  return (
    <div className="space-y-8 pb-10">
      {/* Categories */}
      <div className="flex gap-2 sticky top-[-20px] bg-[#121212]/80 backdrop-blur-md pt-4 pb-2 z-10 px-1 -mx-1">
        {['All', 'Music', 'Podcasts', 'Audiobooks'].map((cat, i) => (
          <button 
            key={cat}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${i === 0 ? 'bg-primary text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Greetings Grid */}
      <header className="space-y-4">
        <h1 className="text-3xl font-black tracking-tight">Good evening</h1>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.greeting.map((song) => (
            <motion.div 
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              whileTap={{ scale: 0.98 }}
              key={`greeting-${song.id}`}
              onClick={() => playTrack(song, allTracks)}
              className={`flex items-center gap-4 bg-white/5 transition-colors rounded-lg overflow-hidden group cursor-pointer h-20 shadow-lg border border-white/[0.03] ${currentTrack?.id === song.id ? 'bg-white/10 ring-1 ring-primary/20' : ''}`}
            >
              <div className="w-20 h-20 flex-shrink-0 relative">
                <img src={song.thumbnail} alt="" className="w-full h-full object-cover shadow-2xl" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <h3 className={`font-bold text-base truncate ${currentTrack?.id === song.id ? 'text-primary' : ''}`}>{song.title}</h3>
              </div>
              <div className={`pr-4 ${currentTrack?.id === song.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all transform translate-x-2 group-hover:translate-x-0`}>
                 <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black shadow-primary/20 shadow-xl scale-90 group-hover:scale-100 transition-transform">
                    <Play size={20} fill="currentColor" />
                 </div>
              </div>
            </motion.div>
          ))}
        </section>
      </header>

      {/* Jump back in */}
      {sections.trending.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Jump back in</h2>
            <button className="text-gray-400 text-xs font-bold uppercase tracking-widest hover:underline">Show all</button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
            {sections.trending.map((song) => (
              <motion.div 
                whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                key={`jump-${song.id}`} 
                onClick={() => playTrack(song, allTracks)}
                className={`min-w-[180px] w-44 space-y-4 p-4 rounded-xl bg-white/[0.03] transition-all cursor-pointer group border border-white/[0.02] ${currentTrack?.id === song.id ? 'bg-white/10 ring-1 ring-primary/10' : ''}`}
              >
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-2xl">
                  <img src={song.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className={`absolute bottom-3 right-3 ${currentTrack?.id === song.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all transform translate-y-2 group-hover:translate-y-0 shadow-2xl`}>
                     <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black">
                        <Play size={20} fill="currentColor" />
                     </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className={`font-bold text-sm truncate leading-tight ${currentTrack?.id === song.id ? 'text-primary' : ''}`}>{song.title}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-medium truncate flex-1">{song.artist}</p>
                    {(() => {
                      const isFollowing = followedArtists.some(a => a.name === song.artist);
                      return (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollowArtist({
                              id: '',
                              name: song.artist,
                              thumbnail: song.thumbnail
                            });
                          }}
                          className={`flex items-center gap-1 text-[10px] uppercase font-black transition-colors ${isFollowing ? 'text-primary' : 'text-gray-600 hover:text-white'}`}
                        >
                          {isFollowing ? <UserCheck size={12} /> : <UserPlus size={12} />}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Mood */}
      {sections.mood.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Mood</h2>
            <button className="text-gray-400 text-xs font-bold uppercase tracking-widest hover:underline">Show all</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {sections.mood.map((song) => (
              <motion.div 
                whileTap={{ scale: 0.98 }}
                key={`mood-${song.id}`} 
                onClick={() => playTrack(song, allTracks)}
                className="space-y-3 cursor-pointer group"
              >
                <div className="relative aspect-square rounded-sm overflow-hidden shadow-lg group-hover:shadow-primary/5 transition-all">
                  <img src={song.thumbnail} alt="" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <h3 className="font-black text-sm text-center tracking-tight truncate">{song.title}</h3>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
