import React, { useState } from 'react';
import { Heart, ListMusic, UserPlus, UserCheck, Settings, Trash2, Play, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { usePlayer, Artist } from '../context/PlayerContext';
import { youtubeService, YouTubeTrack } from '../services/youtubeService';

export default function LibraryScreen() {
  const { 
    likedTracks, 
    playTrack, 
    toggleLike, 
    user, 
    login, 
    followedArtists, 
    toggleFollowArtist,
    t
  } = usePlayer();
  const [loadingArtist, setLoadingArtist] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [artistTracks, setArtistTracks] = useState<YouTubeTrack[]>([]);

  const fetchArtistTracks = async (artist: Artist) => {
    setSelectedArtist(artist);
    setLoadingArtist(artist.name);
    setArtistTracks([]); // Clear previous tracks
    try {
      const tracks = await youtubeService.getPlayableTracks(artist.name);
      setArtistTracks(tracks);
    } catch (error: any) {
      console.error('Failed to fetch artist tracks:', error);
    } finally {
      setLoadingArtist(null);
    }
  };

  if (selectedArtist) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setSelectedArtist(null)}
          className="flex items-center gap-2 text-primary font-bold hover:underline mb-4"
        >
          ← {t('back_to_library')}
        </button>

        <header className="flex flex-col md:flex-row items-end gap-8 pb-8 border-b border-white/10">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-xl overflow-hidden shadow-2xl relative group">
            <img src={selectedArtist.thumbnail} alt={selectedArtist.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            <button 
              onClick={() => artistTracks.length > 0 && playTrack(artistTracks[0], artistTracks)}
              className="absolute bottom-4 right-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center text-black shadow-xl hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
            >
              <Play size={28} fill="currentColor" className="ml-1" />
            </button>
          </div>
          <div className="flex-1 space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-primary">{t('virtual_album')}</span>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white">{selectedArtist.name}</h1>
            <div className="flex items-center gap-4 text-sm font-bold text-gray-400">
              <span>{artistTracks.length} {t('tracks')}</span>
              <span>•</span>
              <button 
                onClick={() => toggleFollowArtist(selectedArtist)}
                className="hover:text-primary transition-colors"
              >
                {t('unfollow')}
              </button>
            </div>
          </div>
        </header>

        <section className="space-y-1">
          {loadingArtist ? (
            <div className="py-20 flex flex-col items-center gap-4 text-gray-500">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="font-bold">{t('loading_tracks')}</p>
            </div>
          ) : (
            artistTracks.map((track, i) => (
              <motion.div 
                key={track.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 group relative"
                onClick={() => playTrack(track, artistTracks)}
              >
                <div className="w-8 text-right text-gray-500 font-mono text-sm group-hover:hidden">
                  {i + 1}
                </div>
                <div className="w-8 hidden group-hover:flex items-center justify-center">
                  <Play size={16} className="text-primary fill-primary" />
                </div>
                <img src={track.thumbnail} alt="" className="w-10 h-10 rounded object-cover shadow" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate group-hover:text-primary transition-colors">{track.title}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                    {(track as any).views ? `${(track as any).views.toLocaleString()} views` : ''}
                  </p>
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  {track.duration}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                  className="p-2 text-gray-500 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Heart size={18} fill={likedTracks.some(t => t.id === track.id) ? "currentColor" : "none"} className={likedTracks.some(t => t.id === track.id) ? "text-primary" : ""} />
                </button>
              </motion.div>
            ))
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight">{t('library')}</h2>
      </header>

      {/* Profile Card */}
      <section className="bg-white/5 hover:bg-white/[0.08] transition-colors rounded-xl p-6 flex items-center gap-6 border border-white/5">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary overflow-hidden shadow-2xl">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-black">{user?.displayName?.[0] || 'G'}</span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-black text-white">{user?.displayName || 'Guest User'}</h3>
          <p className="text-sm font-bold text-gray-400 mt-1">
            {user ? t('premium_member') : t('sync_library')}
          </p>
        </div>
        {!user && (
          <button 
            onClick={login}
            className="bg-primary text-black px-8 py-3 rounded-full font-black text-sm tracking-tight hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
            {t('log_in')}
          </button>
        )}
      </section>

      {/* Followed Artists Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users className="text-primary" size={24} />
            <h2 className="text-xl font-black tracking-tight">{t('followed_artists')}</h2>
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase">
            {followedArtists.length} {t('followed')}
          </span>
        </div>

        {followedArtists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 gap-y-10">
            {followedArtists.map((artist) => (
               <motion.div 
                key={artist.name}
                whileHover={{ y: -8 }}
                className="group cursor-pointer flex flex-col items-center"
                onClick={() => fetchArtistTracks(artist)}
               >
                 <div className="w-full aspect-square rounded-full overflow-hidden mb-4 relative shadow-[0_8px_24px_rgba(0,0,0,0.5)] ring-1 ring-white/10 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] group-hover:ring-primary/50 transition-all duration-300">
                    <img src={artist.thumbnail} alt={artist.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        {loadingArtist === artist.name ? (
                          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play size={28} fill="black" className="text-black ml-1" />
                        )}
                      </div>
                    </div>
                 </div>
                 <div className="text-center w-full">
                    <p className="font-bold text-base truncate group-hover:text-primary transition-colors">{artist.name}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">{t('artist_album')}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFollowArtist(artist); }}
                      className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase font-black text-gray-500 hover:text-white"
                      >
                        {t('unfollow')}
                      </button>
                 </div>
               </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-4 text-center">
            <Users className="text-white/10" size={40} />
            <div>
              <p className="font-bold text-white">{t('find_artists')}</p>
              <p className="text-sm text-gray-500">{t('fav_appear_here')}</p>
            </div>
          </div>
        )}
      </section>

      {/* Liked Songs List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div 
            className={`flex items-center gap-4 ${likedTracks.length > 0 ? 'cursor-pointer group' : ''}`}
            onClick={() => likedTracks.length > 0 && playTrack(likedTracks[0], likedTracks)}
          >
            <h2 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{t('liked_songs')}</h2>
            {likedTracks.length > 0 && (
              <button 
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Play size={20} fill="currentColor" />
              </button>
            )}
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase">
            {likedTracks.length} {t('tracks')}
          </span>
        </div>
        
        {likedTracks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {likedTracks.map((track) => (
              <motion.div 
                whileTap={{ scale: 0.98 }}
                key={track.id} 
                className="flex items-center gap-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all group border border-white/[0.02]"
              >
                <div 
                  onClick={() => playTrack(track, likedTracks)}
                  className="relative w-12 h-12 flex-shrink-0 cursor-pointer"
                >
                  <img src={track.thumbnail} alt={track.title} className="w-full h-full rounded shadow-md object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play size={16} className="text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden" onClick={() => playTrack(track, likedTracks)}>
                  <h3 className="font-bold text-sm truncate leading-tight group-hover:text-primary transition-colors">{track.title}</h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{track.artist}</p>
                </div>
                <button 
                  onClick={() => toggleLike(track)}
                  className="p-2 text-gray-500 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center gap-6 bg-white/[0.02] rounded-2xl border-2 border-dashed border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
               <Heart size={32} className="text-gray-700" />
            </div>
            <div className="text-center">
               <p className="text-lg font-bold text-white">{t('songs_appear_here')}</p>
               <p className="text-sm text-gray-500 mt-1">{t('tap_heart_help')}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
