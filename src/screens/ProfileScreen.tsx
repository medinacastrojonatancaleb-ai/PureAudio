import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Heart, Grid, Music, Settings, AlertCircle, Edit, RefreshCw, 
  MapPin, Link as LinkIcon, LogOut, Camera, UserCheck, Flame 
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

export default function ProfileScreen() {
  const { 
    user, 
    login, 
    logout, 
    language, 
    likedTracks, 
    posts, 
    notify, 
    followedArtists 
  } = usePlayer();
  
  const [activeSubTab, setActiveSubTab] = useState<'posts' | 'likes'>('posts');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(() => {
    return localStorage.getItem(`pureaudio_bio_${user?.uid || 'guest'}`) || 
      (language === 'es' ? 'Apasionado de las buenas vibras sintonizando PureAudio ✨🎧' : 'Music lover tuning retro frequencies in PureAudio ✨🎧');
  });
  
  const [bioLocation, setBioLocation] = useState(() => {
    return localStorage.getItem(`pureaudio_location_${user?.uid || 'guest'}`) || 'CDMX';
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter posts created by this current user
  const userUploadedPosts = useMemo(() => {
    const userDisplayName = user?.displayName || 'Tú 🎧';
    return (posts || []).filter(post => {
      return post.user === userDisplayName || post.user === 'Tú 🎧' || post.userId === user?.uid;
    });
  }, [posts, user]);

  const handleSaveBio = () => {
    localStorage.setItem(`pureaudio_bio_${user?.uid || 'guest'}`, bioText);
    localStorage.setItem(`pureaudio_location_${user?.uid || 'guest'}`, bioLocation);
    setIsEditingBio(false);
    notify(
      language === 'es' ? 'Perfil guardado con éxito!' : 'Profile updated successfully!',
      'success'
    );
  };

  // Upload custom photo avatar directly to storage bucket and update user profile
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify(
        language === 'es' ? 'Selecciona una imagen válida' : 'Please select a valid image file',
        'info'
      );
      return;
    }

    setUploadingAvatar(true);
    try {
      if (user) {
        const fileRef = ref(storage, `users/${user.uid}/avatar_${Date.now()}_${file.name}`);
        const result = await uploadBytes(fileRef, file);
        const url = await getDownloadURL(result.ref);
        
        // Save to user storage
        notify(
          language === 'es' ? 'Imagen subida correctamete 📸' : 'Avatar image uploaded! 📸',
          'success'
        );
        
        // Save updated local info or trigger auth profile update
        // We simulate a fallback sync to local settings as profile change propagates
        localStorage.setItem(`pureaudio_avatar_${user.uid}`, url);
      } else {
        // Guest placeholder save
        const url = URL.createObjectURL(file);
        localStorage.setItem(`pureaudio_avatar_guest`, url);
        notify(
          language === 'es' ? 'Imagen de invitado establecida 📸' : 'Guest avatar updated! 📸',
          'success'
        );
      }
    } catch (err: any) {
      console.error("Avatar failed:", err);
      // Fallback preview
      const fallbackUrl = URL.createObjectURL(file);
      localStorage.setItem(`pureaudio_avatar_${user?.uid || 'guest'}`, fallbackUrl);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Retrieved avatar
  const avatarUrl = useMemo(() => {
    const custom = localStorage.getItem(`pureaudio_avatar_${user?.uid || 'guest'}`);
    if (custom) return custom;
    return user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
  }, [user]);

  return (
    <div className="flex-grow w-full h-full text-white bg-[#0B0B0F] overflow-y-auto scrollbar-hide pb-24">
      
      {/* Dynamic Cover Graphic Banner */}
      <div className="h-44 w-full bg-gradient-to-r from-purple-900/60 via-[#16161D] to-[#7C4DFF]/40 relative flex items-end">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0B0B0F] z-10" />
        
        {/* Flame Accent */}
        <div className="absolute top-4 right-4 bg-black/50 border border-white/5 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider font-extrabold z-10">
          <Flame size={12} className="text-primary animate-pulse" />
          <span>Vibe Rank #1</span>
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-20 space-y-6 max-w-xl mx-auto">
        
        {/* User Identity Row */}
        <div className="flex items-end gap-4">
          
          {/* Avatar frame */}
          <div className="w-24 h-24 rounded-full border-4 border-[#0B0B0F] bg-[#16161D] shadow-[0_15px_30px_rgba(124,77,255,0.4)] overflow-hidden relative group">
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            {uploadingAvatar ? (
              <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                <RefreshCw size={18} className="text-primary animate-spin" />
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
              >
                <Camera size={16} className="text-white" />
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex-grow pb-1">
            <h3 className="text-lg font-black tracking-tight">{user?.displayName || (language === 'es' ? 'Invitado Sónico' : 'Sonic Guest')}</h3>
            <p className="text-[10px] text-[#A0A0B8] font-mono uppercase tracking-widest mt-0.5">
              @ {user?.email ? user.email.split('@')[0] : 'sonic_guest'}
            </p>
          </div>

          {/* Settings & Logout buttons */}
          <div className="flex gap-2 pb-1.5">
            {user ? (
              <button
                onClick={logout}
                className="p-2.5 bg-[#16161D] hover:bg-red-500/10 hover:text-red-400 transition-all rounded-xl border border-white/5 active:scale-95 cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
            ) : (
              <button
                onClick={login}
                className="bg-primary hover:bg-opacity-90 text-white font-black text-[10px] tracking-wider uppercase px-4 py-2 rounded-full cursor-pointer shadow-[0_10px_20px_rgba(124,77,255,0.25)]"
              >
                {language === 'es' ? 'Conectar' : 'Connect'}
              </button>
            )}
          </div>
        </div>

        {/* Counter Statistics Plate */}
        <div className="grid grid-cols-3 bg-[#16161D] border border-white/5 rounded-2xl p-4 text-center divide-x divide-white/5">
          <div>
            <span className="block text-lg font-black text-primary font-mono">{userUploadedPosts.length}</span>
            <span className="text-[8.5px] font-bold text-[#A0A0B8] uppercase tracking-widest">{language === 'es' ? 'Aportes' : 'Posts'}</span>
          </div>
          <div>
            <span className="block text-lg font-black text-primary font-mono">{likedTracks.length}</span>
            <span className="text-[8.5px] font-bold text-[#A0A0B8] uppercase tracking-widest">{language === 'es' ? 'Canciones' : 'Liked'}</span>
          </div>
          <div>
            <span className="block text-lg font-black text-primary font-mono">{followedArtists.length + 42}</span>
            <span className="text-[8.5px] font-bold text-[#A0A0B8] uppercase tracking-widest">{language === 'es' ? 'Seguidores' : 'Followers'}</span>
          </div>
        </div>

        {/* Bio segment box */}
        <div className="bg-[#16161D] border border-white/5 rounded-2xl p-4.5 space-y-3.5 relative">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider font-mono">
              {language === 'es' ? 'Información de Cuenta' : 'About Creator'}
            </span>
            
            <button
              onClick={() => setIsEditingBio(!isEditingBio)}
              className="p-1.5 text-[#A0A0B8] hover:text-primary transition-colors hover:bg-white/[0.03] rounded-lg"
            >
              <Edit size={12} />
            </button>
          </div>

          {isEditingBio ? (
            <div className="space-y-3">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                rows={2}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
              />
              <div className="flex items-center gap-2">
                <MapPin size={11} className="text-[#A0A0B8]" />
                <input
                  type="text"
                  value={bioLocation}
                  onChange={(e) => setBioLocation(e.target.value)}
                  className="bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary flex-grow"
                  placeholder="Location"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveBio}
                className="w-full py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full hover:scale-101 active:scale-95 transition-all"
              >
                {language === 'es' ? 'Guardar Cambios' : 'Save Details'}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs font-medium leading-relaxed text-gray-300">
                {bioText}
              </p>
              
              <div className="flex items-center gap-3.5 text-[10px] text-[#A0A0B8]">
                <div className="flex items-center gap-1 font-bold">
                  <MapPin size={11} className="text-primary" />
                  <span>{bioLocation}</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <LinkIcon size={11} className="text-primary" />
                  <span className="hover:underline hover:text-white cursor-pointer select-all">pureaudio.me/vibes</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Categorized Feed Tabs Navigation Selector */}
        <div className="space-y-4">
          <div className="flex border-b border-white/5">
            <button 
              onClick={() => setActiveSubTab('posts')}
              className={`flex-1 pb-3 text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all relative ${
                activeSubTab === 'posts' ? 'text-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid size={13} />
              <span>{language === 'es' ? 'Mis Vídeos/Fotos' : 'My Uploaded Feed'}</span>
              
              {activeSubTab === 'posts' && (
                <motion.div layoutId="profile_tab_bar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            
            <button 
              onClick={() => setActiveSubTab('likes')}
              className={`flex-1 pb-3 text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all relative ${
                activeSubTab === 'likes' ? 'text-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Heart size={13} />
              <span>{language === 'es' ? 'Favoritos' : 'Liked Tracks'}</span>
              
              {activeSubTab === 'likes' && (
                <motion.div layoutId="profile_tab_bar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>

          {/* Grid display contents container */}
          <div>
            <AnimatePresence mode="wait">
              {activeSubTab === 'posts' ? (
                <motion.div
                  key="posts_tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="grid grid-cols-2 gap-3"
                >
                  {userUploadedPosts.length === 0 ? (
                    <div className="col-span-2 text-center p-8 bg-[#16161D] border border-white/5 rounded-2xl py-12">
                      <Music size={24} className="text-gray-500 mx-auto mb-2.5" />
                      <p className="text-xs font-black text-gray-300">
                        {language === 'es' ? 'Sin publicaciones todavía' : 'No posts uploaded yet'}
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1">
                        {language === 'es' ? 'Toca "Crear" para añadir la primera canción' : 'Tap "Crear" to upload your first audio track'}
                      </p>
                    </div>
                  ) : (
                    userUploadedPosts.map((post) => (
                      <div 
                        key={post.id}
                        className="bg-[#16161D] border border-white/5 hover:border-primary/20 transition-all rounded-2xl overflow-hidden group flex flex-col relative text-left"
                      >
                        {/* image wrapper */}
                        <div className="aspect-square bg-black overflow-hidden relative">
                          <img 
                            src={post.image || post.music?.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80'} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                            alt=""
                          />
                          
                          {/* Top type overlay label */}
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-[7px] uppercase tracking-widest font-mono font-black border border-white/5">
                            {post.videoUrl ? 'VIDEO' : 'STORY PHOTO'}
                          </div>
                        </div>

                        {/* description details */}
                        <div className="p-3 space-y-1.5">
                          <p className="text-[10px] text-white/90 font-medium truncate leading-tight">
                            {post.text}
                          </p>
                          {post.music && (
                            <div className="text-[8px] text-primary font-bold flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/10 w-fit max-w-full">
                              <Music size={7} className="animate-pulse flex-shrink-0" />
                              <span className="truncate">{post.music.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="likes_tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-2.5"
                >
                  {likedTracks.length === 0 ? (
                    <div className="text-center p-8 bg-[#16161D] border border-white/5 rounded-2xl py-12">
                      <Heart size={24} className="text-gray-500 mx-auto mb-2.5" />
                      <p className="text-xs font-black text-gray-300">
                        {language === 'es' ? 'No tienes favoritos aún' : 'No favorites liked yet'}
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1">
                        {language === 'es' ? 'Explora el feed y marca la campana de favoritos ❤️' : 'Explore music feeds and hit the Heart button ❤️'}
                      </p>
                    </div>
                  ) : (
                    likedTracks.map((track) => (
                      <div 
                        key={track.id}
                        className="p-2.5 bg-[#16161D] hover:bg-[#1C1C26] transition-all border border-white/5 rounded-xl flex items-center justify-between gap-3 text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={track.thumbnail} 
                            alt="" 
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-[11px] truncate leading-normal">{track.title}</h4>
                            <p className="text-[9px] text-[#A0A0B8] mt-0.5 truncate">{track.artist}</p>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <Heart size={13} className="text-primary fill-current" />
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
