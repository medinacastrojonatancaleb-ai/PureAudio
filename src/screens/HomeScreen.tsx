import React from 'react';
import { Play, Heart, MoreVertical, TrendingUp, Music } from 'lucide-react';
import { motion } from 'motion/react';
import { usePlayer } from '../context/PlayerContext';

const MOCKED_SONGS = [
  { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=120&h=120&fit=crop' },
  { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&h=120&fit=crop' },
  { id: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi', thumbnail: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=120&h=120&fit=crop' },
  { id: '9bZkp7q19f0', title: 'Gangnam Style', artist: 'PSY', thumbnail: 'https://images.unsplash.com/photo-1459749411177-042180ce673f?w=120&h=120&fit=crop' },
];

export default function HomeScreen() {
  const { playTrack, currentTrack, isPlaying, toggleLike, likedTracks, getLikeCount } = usePlayer();
  return (
    <div className="space-y-10">
      {/* Search Bar Placeholder */}
      <section>
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 flex items-center gap-4 text-onSurface">
          <div className="bg-primary/20 p-2 rounded-xl text-primary">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-sm font-black">Discover New Hits</p>
            <p className="text-[11px] text-onSurfaceVariant font-bold uppercase tracking-wider">Top 50 global charts</p>
          </div>
        </div>
      </section>

      {/* Featured Grid */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-black tracking-tight">For You</h2>
          <button className="text-primary text-xs font-black uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full">See all</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {MOCKED_SONGS.map((song) => {
            const isLiked = likedTracks.some(t => t.id === song.id);
            return (
              <motion.div 
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                key={song.id} 
                onClick={() => playTrack(song, MOCKED_SONGS)}
                className={`min-w-[160px] cursor-pointer group space-y-3 p-2 rounded-[28px] transition-all ${currentTrack?.id === song.id ? 'bg-primary/5' : 'hover:bg-surfaceVariant/40'}`}
              >
                <div className="relative aspect-square rounded-[24px] overflow-hidden shadow-lg group-hover:shadow-primary/20 transition-all">
                  <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-xl">
                        <Play size={24} fill="currentColor" />
                     </div>
                  </div>
                </div>
                <div className="px-1 text-center">
                  <h3 className="font-black text-sm truncate leading-tight">{song.title}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <p className="text-[11px] font-bold text-onSurfaceVariant uppercase tracking-tight">{song.artist}</p>
                    <div className="flex items-center gap-0.5 text-primary">
                      <Heart size={10} fill={isLiked ? "currentColor" : "none"} />
                      <span className="text-[9px] font-black">{getLikeCount(song.id)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* List Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full"></div>
          <h2 className="text-2xl font-black tracking-tight tracking-tighter">Quick Picks</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {MOCKED_SONGS.map((song) => {
            const isLiked = likedTracks.some(t => t.id === song.id);
            return (
              <motion.div 
                whileTap={{ scale: 0.98 }}
                key={song.id} 
                onClick={() => playTrack(song, MOCKED_SONGS)}
                className={`flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer group ${currentTrack?.id === song.id ? 'bg-primary/10' : 'hover:bg-surfaceVariant/60'}`}
              >
                <div className="relative w-16 h-16 flex-shrink-0">
                  <img src={song.thumbnail} alt={song.title} className="w-full h-full rounded-2xl object-cover shadow-md" />
                  {currentTrack?.id === song.id && isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                      <div className="flex gap-1 items-end h-6">
                        <motion.div animate={{ height: [12, 24, 8, 20] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 bg-white" />
                        <motion.div animate={{ height: [20, 10, 24, 12] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1 bg-white" />
                        <motion.div animate={{ height: [8, 18, 12, 24] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-black text-[15px] truncate text-onSurface leading-tight">{song.title}</h3>
                  <p className="text-xs font-bold text-onSurfaceVariant/70 truncate uppercase tracking-tight mt-0.5">{song.artist}</p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-primary">
                    <Heart size={12} fill={isLiked ? "currentColor" : "none"} />
                    <span>{getLikeCount(song.id)} likes</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                    className={`p-2 transition-colors ${isLiked ? 'text-primary' : 'text-onSurfaceVariant hover:text-primary'}`}
                  >
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                  <button className="p-2 text-onSurfaceVariant">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
