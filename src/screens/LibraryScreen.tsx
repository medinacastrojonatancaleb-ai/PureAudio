import React from 'react';
import { Heart, ListMusic, Download, Clock, ChevronRight, Settings, Trash2, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { usePlayer } from '../context/PlayerContext';

export default function LibraryScreen() {
  const { likedTracks, playTrack, toggleLike, user, login } = usePlayer();

  return (
    <div className="space-y-8 pb-4">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-black">Your Library</h2>
        <button className="p-2 bg-surfaceVariant/50 rounded-full">
          <Settings size={22} />
        </button>
      </header>

      {/* Profile Card */}
      <section className="bg-primary/5 border border-primary/10 rounded-[32px] p-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white overflow-hidden shadow-lg">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black">{user?.displayName?.[0] || 'G'}</span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-black">{user?.displayName || 'Guest User'}</h3>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">
            {user ? 'Premium Member' : 'Sign in to sync'}
          </p>
        </div>
        {!user && (
          <button 
            onClick={login}
            className="bg-primary px-4 py-2 rounded-full text-white text-xs font-black uppercase tracking-wider"
          >
            Login
          </button>
        )}
      </section>

      {/* Liked Songs List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight">Liked Songs</h2>
          <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
            {likedTracks.length} tracks
          </span>
        </div>
        
        {likedTracks.length > 0 ? (
          <div className="space-y-2">
            {likedTracks.map((track) => (
              <motion.div 
                whileTap={{ scale: 0.98 }}
                key={track.id} 
                className="flex items-center gap-4 p-3 rounded-2xl bg-surfaceVariant/30 hover:bg-surfaceVariant/60 transition-all group"
              >
                <div 
                  onClick={() => playTrack(track, likedTracks)}
                  className="relative w-14 h-14 flex-shrink-0 cursor-pointer"
                >
                  <img src={track.thumbnail} alt={track.title} className="w-full h-full rounded-xl object-cover shadow-md" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                    <Play size={20} className="text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden" onClick={() => playTrack(track, likedTracks)}>
                  <h3 className="font-black text-sm truncate text-onSurface leading-tight">{track.title}</h3>
                  <p className="text-[10px] font-bold text-onSurfaceVariant/70 truncate uppercase tracking-tight mt-1">{track.artist}</p>
                </div>
                <button 
                  onClick={() => toggleLike(track)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center gap-4 bg-surfaceVariant/20 rounded-3xl border-2 border-dashed border-outline/10">
            <Heart size={48} className="text-outline/20" />
            <p className="text-sm font-bold text-onSurfaceVariant">No liked songs yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
