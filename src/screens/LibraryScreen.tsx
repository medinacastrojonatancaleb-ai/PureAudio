import React, { useState } from 'react';
import { Heart, ListMusic, UserPlus, UserCheck, Settings, Trash2, Play, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { usePlayer } from '../context/PlayerContext';
import { youtubeService } from '../services/youtubeService';

export default function LibraryScreen() {
  const { 
    likedTracks, 
    playTrack, 
    toggleLike, 
    user, 
    login, 
    followedArtists, 
    toggleFollowArtist
  } = usePlayer();
  const [loadingArtist, setLoadingArtist] = useState<string | null>(null);

  const playArtistTracks = async (artistName: string) => {
    setLoadingArtist(artistName);
    try {
      const tracks = await youtubeService.getPlayableTracks(artistName);
      if (tracks.length > 0) {
        playTrack(tracks[0], tracks);
      }
    } catch (error: any) {
      console.error('Failed to play artist tracks:', error);
    } finally {
      setLoadingArtist(null);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight">Your Library</h2>
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
            {user ? 'Premium Member' : 'Sign in to sync your library'}
          </p>
        </div>
        {!user && (
          <button 
            onClick={login}
            className="bg-primary text-black px-8 py-3 rounded-full font-black text-sm tracking-tight hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
            Log in with Google
          </button>
        )}
      </section>

      {/* Followed Artists Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users className="text-primary" size={24} />
            <h2 className="text-xl font-black tracking-tight">Followed Artists</h2>
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase">
            {followedArtists.length} followed
          </span>
        </div>

        {followedArtists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 gap-y-10">
            {followedArtists.map((artist) => (
               <motion.div 
                key={artist.name}
                whileHover={{ y: -8 }}
                className="group cursor-pointer flex flex-col items-center"
                onClick={() => playArtistTracks(artist.name)}
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
                    <p className="text-xs text-gray-500 font-medium mt-1">Artist Album</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFollowArtist(artist); }}
                      className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase font-black text-gray-500 hover:text-white"
                    >
                      Unfollow
                    </button>
                 </div>
               </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-4 text-center">
            <Users className="text-white/10" size={40} />
            <div>
              <p className="font-bold text-white">Find artists to follow</p>
              <p className="text-sm text-gray-500">Your favorite artists will appear here</p>
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
            <h2 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">Liked Songs</h2>
            {likedTracks.length > 0 && (
              <button 
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Play size={20} fill="currentColor" />
              </button>
            )}
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase">
            {likedTracks.length} tracks
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
               <p className="text-lg font-bold text-white">Songs you like will appear here</p>
               <p className="text-sm text-gray-500 mt-1">Tap the heart to add a song to your library</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
