import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MessageCircle, Share2, Music, Tag, Image, Send, Plus, 
  Flame, Award, X, Check, Volume2, Sparkles, Search, Compass, LogIn,
  Video, Film, Trash2, Camera
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { youtubeService } from '../services/youtubeService';

interface Story {
  id: string;
  user: string;
  avatar: string;
  hasStory: boolean;
  content: string;
  contentType: 'image' | 'video';
  attachedSong?: string;
  attachedArtist?: string;
}

interface StreakFriend {
  name: string;
  avatar: string;
  streakCount: number;
  maintainedToday: boolean;
}

const PRESET_STORY_BG_IMAGES = [
  { name: 'Neon Concert', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80' },
  { name: 'Cyber Neon Lights', url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=80' },
  { name: 'Golden Hour Sunset', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80' },
  { name: 'Dreamy Stars', url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=600&q=80' },
  { name: 'Retro Vibes', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80' }
];

export default function SocialScreen() {
  const { 
    playTrack, 
    t, 
    language, 
    posts, 
    stories, 
    addPost, 
    addStory, 
    likePostInContext, 
    user 
  } = usePlayer();

  const [activeStory, setActiveStory] = useState<Story | null>(null);
  
  // Real world music stars Daily Streaks 
  const [streaks, setStreaks] = useState<StreakFriend[]>([
    { name: 'Coldplay', avatar: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=80&q=80', streakCount: 42, maintainedToday: false },
    { name: 'Rosalía', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80', streakCount: 28, maintainedToday: true },
    { name: 'Billie Eilish', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', streakCount: 56, maintainedToday: false }
  ]);

  const [showStreakModal, setShowStreakModal] = useState<string | null>(null);

  // Post composer state
  const [newPostText, setNewPostText] = useState('');
  const [attachedImage, setAttachedImage] = useState('');
  const [attachedVideo, setAttachedVideo] = useState('');
  const [attachedVideoName, setAttachedVideoName] = useState('');
  const [composerOption, setComposerOption] = useState<'status' | 'photo' | 'song' | 'video'>('status');
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedVideoName(file.name);
      const url = URL.createObjectURL(file);
      setAttachedVideo(url);
    }
  };

  // Story Creator Modal state
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [newStoryBgUrl, setNewStoryBgUrl] = useState(PRESET_STORY_BG_IMAGES[0].url);
  const [newStoryText, setNewStoryText] = useState('');

  // Live song search state in composer
  const [searchSongQuery, setSearchSongQuery] = useState('');
  const [searchSongResults, setSearchSongResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('pureaudio_social_selected_music');
      if (saved) {
        localStorage.removeItem('pureaudio_social_selected_music');
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not parse social selected music:", e);
    }
    return null;
  });

  const handleSearchSong = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchSongQuery.trim()) return;
    setSearching(true);
    try {
      const tracks = await youtubeService.search(searchSongQuery);
      setSearchSongResults(tracks || []);
    } catch (err) {
      console.error('Failed to search songs for social attaching:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleCreatePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    // Call shared context-level post creator
    addPost(
      newPostText, 
      attachedImage || undefined, 
      selectedMusic ? {
        id: selectedMusic.id,
        title: selectedMusic.title,
        artist: selectedMusic.artist,
        thumbnail: selectedMusic.thumbnail
      } : undefined,
      attachedVideo || undefined
    );

    // Reset composer state
    setNewPostText('');
    setAttachedImage('');
    setAttachedVideo('');
    setAttachedVideoName('');
    setSelectedMusic(null);
    setSearchSongQuery('');
    setSearchSongResults([]);
    setComposerOption('status');
  };

  const handleCreateStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Call shared context-level story creator
    addStory(
      newStoryBgUrl,
      selectedMusic ? {
        id: selectedMusic.id,
        title: selectedMusic.title,
        artist: selectedMusic.artist,
        thumbnail: selectedMusic.thumbnail
      } : undefined
    );

    // Reset story creator state
    setShowStoryModal(false);
    setSelectedMusic(null);
    setSearchSongQuery('');
    setSearchSongResults([]);
  };

  const maintainStreak = (friendName: string) => {
    setStreaks(prev => prev.map(s => {
      if (s.name === friendName) {
        return { ...s, streakCount: s.streakCount + 1, maintainedToday: true };
      }
      return s;
    }));
    setShowStreakModal(friendName);
  };

  // Align username and avatar with Context logs or Guest
  const ownDisplayName = user?.displayName || 'Tú 🎧';
  const ownAvatar = user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

  // Merge context stories with display layout
  // We make sure the user's personal story is shown first with a unique styling
  const userStory = stories.find(s => s.user === ownDisplayName);
  const otherStories = stories.filter(s => s.user !== ownDisplayName);

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      
      {/* Stories Horizontal Tray */}
      <section className="bg-[#0b0c0f]/80 backdrop-blur-2xl border border-white/5 p-4 rounded-3xl shadow-xl">
        <div className="flex justify-between items-center mb-3 pr-2">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#00df82] uppercase">
            {language === 'es' ? 'Historias de Artistas & Fans' : 'Artists & Fan Stories'}
          </span>
          <button 
            onClick={() => setShowStoryModal(true)}
            className="text-[9.5px] font-black uppercase text-[#00df82] hover:text-[#00cbff] flex items-center gap-1 transition-colors"
          >
            <Plus size={11} strokeWidth={3} />
            <span>{language === 'es' ? 'Publicar Historia' : 'Post Story'}</span>
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide py-1">
          {/* OWN Story Bubble (with trigger or view) */}
          <div 
            onClick={() => userStory ? setActiveStory(userStory) : setShowStoryModal(true)}
            className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
          >
            <div className="relative">
              <div 
                className={`absolute inset-0 rounded-full bg-gradient-to-tr ${
                  userStory 
                    ? 'from-[#00df82] via-[#00cbff] to-[#ff2e54] animate-spin-slow' 
                    : 'from-white/10 to-white/10'
                } p-[2.5px]`}
              >
                <div className="absolute inset-[3px] bg-black rounded-full" />
              </div>
              <img 
                src={ownAvatar} 
                alt="Your Avatar" 
                className="w-14 h-14 object-cover rounded-full relative z-10 border-2 border-black group-hover:scale-105 transition-transform" 
              />
              
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary text-black rounded-full flex items-center justify-center border-2 border-[#12151c] z-20">
                <Plus size={12} strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors truncate max-w-[64px]">
              {language === 'es' ? 'Tu Historia' : 'Your Story'}
            </span>
          </div>

          {/* Other famous artists stories */}
          {otherStories.map((story) => (
            <div 
              key={story.id} 
              onClick={() => story.hasStory && setActiveStory(story)}
              className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
            >
              <div className="relative">
                <div 
                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00df82] via-[#00cbff] to-[#ff2e54] p-[2.5px]"
                >
                  <div className="absolute inset-[3px] bg-black rounded-full" />
                </div>
                <img 
                  src={story.avatar} 
                  alt="" 
                  className="w-14 h-14 object-cover rounded-full relative z-10 border-2 border-black group-hover:scale-105 transition-transform" 
                />
              </div>
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors truncate max-w-[64px]">
                {story.user}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Snapchat active Streaks Widgets */}
      <section className="bg-gradient-to-r from-[#12151c]/60 to-[#0e1915]/60 border border-primary/10 p-5 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/15 rounded-xl border border-primary/25">
              <Flame size={16} className="text-primary animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">{language === 'es' ? 'Rachas de Música Real' : 'Real Artist Streaks'}</h4>
              <p className="text-[10px] text-gray-500 font-medium">
                {language === 'es' ? 'Mantén vivo el fuego diario sintonizando música real.' : 'Maintain your dynamic fire by listening to globally famous creators.'}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase">VibeSync</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {streaks.map((friend) => (
            <div 
              key={friend.name}
              className="bg-black/35 border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-3 group hover:border-primary/20 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <img src={friend.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-white/5" />
                <div className="min-w-0">
                  <h5 className="text-xs font-black text-white truncate leading-none">{friend.name}</h5>
                  <p className="text-[10px] text-primary font-mono font-bold mt-1 flex items-center gap-0.5 animate-pulse">
                    🔥 {friend.streakCount} {language === 'es' ? 'días' : 'days'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => !friend.maintainedToday && maintainStreak(friend.name)}
                disabled={friend.maintainedToday}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 ${
                  friend.maintainedToday 
                    ? 'bg-neutral-800 text-gray-500' 
                    : 'bg-primary text-black hover:scale-105 active:scale-95 shadow-md shadow-primary/20'
                }`}
              >
                {friend.maintainedToday ? (
                  <><Check size={10} strokeWidth={3} /> {language === 'es' ? 'Listo' : 'Kept'}</>
                ) : (
                  <>{language === 'es' ? 'Racha 🔥' : 'Streak 🔥'}</>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Composer panel */}
      <section className="bg-[#0b0c0f]/80 backdrop-blur-2xl border border-white/10 p-5 rounded-[28px] shadow-xl space-y-4">
        <form onSubmit={handleCreatePostSubmit} className="space-y-4">
          <div className="flex gap-3">
            <img 
              src={ownAvatar} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover border border-primary/20" 
            />
            <div className="flex-1">
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder={language === 'es' ? "¿Qué estás escuchando o sintiendo hoy?" : "What globally famous song are you playing or feeling today?"}
                className="w-full bg-transparent border-none text-sm text-white/95 focus:outline-none placeholder:text-gray-500 resize-none h-16"
              />
            </div>
          </div>

          {/* Attached items indicators preview */}
          {(selectedMusic || attachedImage || attachedVideo) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
              {selectedMusic && (
                <div className="bg-primary/10 text-primary text-[10px] font-black font-mono border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Music size={11} />
                  <span>Attach: {selectedMusic.title} ({selectedMusic.artist})</span>
                  <button type="button" onClick={() => setSelectedMusic(null)} className="hover:text-white">✕</button>
                </div>
              )}
              {attachedImage && (
                <div className="bg-cyan-500/10 text-cyan-400 text-[10px] font-black font-mono border border-cyan-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Image size={11} />
                  <span>Attached Photo Card</span>
                  <button type="button" onClick={() => setAttachedImage('')} className="hover:text-white">✕</button>
                </div>
              )}
              {attachedVideo && (
                <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black font-mono border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                  <Video size={11} />
                  <span>Video: {attachedVideoName || 'Clip'}</span>
                  <button type="button" onClick={() => { setAttachedVideo(''); setAttachedVideoName(''); }} className="hover:text-white">✕</button>
                </div>
              )}
            </div>
          )}

          {/* Actions toolbar row */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex gap-2 items-center">
              
              {/* Attach Music */}
              <button 
                type="button"
                id="btn-add-music-composer"
                onClick={() => setComposerOption(composerOption === 'song' ? 'status' : 'song')}
                className={`px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                  composerOption === 'song' 
                    ? 'bg-primary text-black border-primary shadow-lg shadow-primary/25' 
                    : 'bg-primary/15 border-primary/30 text-primary hover:bg-primary/25'
                }`}
                title={language === 'es' ? 'Agregar música' : 'Add Music'}
              >
                <Music size={13} className={composerOption === 'song' ? 'text-black' : 'text-primary animate-pulse'} />
                <span>{language === 'es' ? 'Agregar música' : 'Add Music'}</span>
              </button>

              {/* Attach Preset Image */}
              <button 
                type="button"
                onClick={() => {
                  setAttachedImage('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80');
                  setComposerOption('photo');
                }}
                className={`p-2.5 rounded-xl border transition-all ${
                  attachedImage ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                }`}
                title="Attach Preset Card Photo"
              >
                <Image size={15} />
              </button>

              {/* Upload or Record Video from cell phone */}
              <input 
                type="file" 
                accept="video/*" 
                ref={videoInputRef} 
                onChange={handleVideoFileChange} 
                className="hidden" 
              />
              <button 
                type="button"
                onClick={() => {
                  setComposerOption('video');
                  videoInputRef.current?.click();
                }}
                className={`p-2.5 rounded-xl border transition-all ${
                  attachedVideo ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                }`}
                title={language === 'es' ? 'Subir o Grabar Video' : 'Upload or Record Video'}
              >
                <Video size={15} />
              </button>
            </div>

            <button 
              type="submit"
              disabled={!newPostText.trim() && !attachedVideo}
              className="px-5 py-2 bg-white hover:bg-primary disabled:opacity-40 disabled:hover:bg-white text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-1.5 active:scale-95"
            >
              <Send size={12} />
              <span>{language === 'es' ? 'Publicar al Feed' : 'Share to Feed'}</span>
            </button>
          </div>

          {/* Sub composer: REAL video file preview! */}
          {composerOption === 'video' && attachedVideo && (
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3 animate-fade-in text-center">
              <span className="block text-[8px] font-mono font-black text-emerald-400 uppercase tracking-widest text-left">
                {language === 'es' ? 'VISTA PREVIA DEL VIDEO TIKTOK' : 'TIKTOK VIDEO PREVIEW'}
              </span>
              <div className="relative aspect-[9/16] h-64 mx-auto rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black">
                <video 
                  src={attachedVideo} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover" 
                />
                <button 
                  type="button" 
                  onClick={() => { setAttachedVideo(''); setAttachedVideoName(''); }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 font-mono">
                {attachedVideoName}
              </p>
            </div>
          )}

          {/* Sub composer: REAL youtube engine search box! */}
          {composerOption === 'song' && (
            <div className="bg-black/40 p-3.5 rounded-2xl border border-white/5 text-xs text-white space-y-3 animate-fade-in">
              <span className="block text-[8px] font-mono font-black text-gray-500 uppercase tracking-widest">
                {language === 'es' ? 'BUSCADOR DE MÚSICA MUNDIAL' : 'SEARCH WORLDWIDE MUSIC LIBRARY'}
              </span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3 top-2.5 text-gray-500" />
                  <input 
                    type="text" 
                    value={searchSongQuery}
                    onChange={(e) => setSearchSongQuery(e.target.value)}
                    placeholder={language === 'es' ? "Buscar: Bad Bunny, Coldplay, The Weeknd..." : "Search artists, singles, albums..."}
                    className="w-full bg-white/5 text-xs text-white pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary border border-white/5"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchSong(); } }}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => handleSearchSong()}
                  className="bg-primary text-black font-black uppercase px-3 rounded-xl hover:opacity-90 text-[10px]"
                >
                  {language === 'es' ? 'Buscar' : 'Search'}
                </button>
              </div>

              {searching && (
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  <span>Sintonizando señales analógicas...</span>
                </div>
              )}

              <div className="max-h-56 overflow-y-auto space-y-1.5 scrollbar-hide">
                {searchSongResults.map((song, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setSelectedMusic(song);
                      setComposerOption('status');
                    }}
                    className="p-2 rounded-xl bg-white/[0.01] hover:bg-white/5 cursor-pointer flex items-center justify-between gap-3 transition-colors border border-white/5 hover:border-white/10"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative group/thumb w-8 h-8 rounded overflow-hidden flex-shrink-0">
                        <img src={song.thumbnail} alt="" className="w-full h-full object-cover shadow" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-100 group-hover/thumb:scale-105 transition-all">
                          <Play size={10} className="text-primary fill-primary" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h6 className="font-bold text-white text-[11.5px] leading-tight truncate">{song.title}</h6>
                        <p className="text-[9.5px] text-gray-400 leading-none mt-0.5 truncate">{song.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        id={`btn-listen-prev-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrack(song);
                        }}
                        className="px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 text-gray-300 rounded border border-white/5 transition-all active:scale-95"
                      >
                        {language === 'es' ? 'Escuchar' : 'Listen'}
                      </button>
                      <span className="text-[9px] font-mono font-black bg-[#00df82]/15 text-[#00df82] px-2.5 py-1 rounded-md uppercase border border-[#00df82]/20">
                        ATTACH
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </section>

      {/* Social Wall Feed Grid */}
      <section className="space-y-4">
        {posts.map((post: any) => (
          <article 
            key={post.id}
            className="bg-[#0b0c0f]/80 backdrop-blur-2xl border border-white/5 p-5 rounded-[28px] shadow-xl space-y-3.5 hover:border-white/10 transition-colors"
          >
            {/* Post Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={post.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-white/5" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white hover:text-primary cursor-pointer transition-colors leading-none">{post.user}</span>
                    {post.user === ownDisplayName && (
                      <span className="text-[8px] tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 px-1 rounded font-bold">You</span>
                    )}
                  </div>
                  <span className="text-[9.5px] text-gray-500 font-bold tracking-tight">{post.time}</span>
                </div>
              </div>
            </div>

            {/* Post text */}
            <p className="text-xs text-white/90 leading-relaxed font-sans">{post.text}</p>

            {/* Optional post attached picture */}
            {post.image && (
              <div className="rounded-2xl overflow-hidden border border-white/5 aspect-video w-full relative shadow-md">
                <img src={post.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Optional post attached video */}
            {post.videoUrl && (
              <div className="rounded-2xl overflow-hidden border border-white/5 aspect-video w-full relative shadow-md bg-black">
                <video 
                  src={post.videoUrl} 
                  controls 
                  playsInline 
                  className="w-full h-full object-contain" 
                />
              </div>
            )}

            {/* Optional post attached music clip */}
            {post.music && (
              <div 
                onClick={() => playTrack({
                  id: post.music.id,
                  title: post.music.title,
                  artist: post.music.artist,
                  thumbnail: post.music.thumbnail
                })}
                className="bg-black/40 border border-primary/20 hover:border-primary/50 cursor-pointer p-2.5 rounded-2xl flex items-center justify-between gap-3 transition-all relative overflow-hidden group shadow-md"
              >
                {/* Soft pulse glow background */}
                <div className="absolute right-0 top-0 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                    <img src={post.music.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Volume2 size={15} fill="currentColor" className="text-primary animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-white group-hover:text-primary transition-colors leading-tight">{post.music.title}</h5>
                    <p className="text-[9.5px] text-gray-500 tracking-wide font-bold uppercase mt-0.5">{post.music.artist}</p>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 text-primary uppercase text-[8.5px] font-black tracking-widest px-3 py-1.5 rounded-xl group-hover:bg-primary group-hover:text-black transition-all">
                  Play Track
                </div>
              </div>
            )}

            {/* Actions Footer row */}
            <div className="flex items-center gap-6 pt-3.5 border-t border-white/5 text-[11px] font-bold text-gray-500">
              <button 
                onClick={() => likePostInContext(post.id)}
                className={`flex items-center gap-1.5 hover:text-white transition-colors ${
                  post.isLiked ? 'text-red-400' : 'text-gray-500'
                }`}
              >
                <Heart size={15} fill={post.isLiked ? 'currentColor' : 'none'} />
                <span>{post.likes}</span>
              </button>

              <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                <MessageCircle size={15} />
                <span>{post.comments}</span>
              </button>

              <button className="flex items-center gap-1.5 ml-auto hover:text-white transition-colors">
                <Share2 size={14} />
              </button>
            </div>

          </article>
        ))}
      </section>

      {/* CREATE STORY DIALOG MODAL */}
      <AnimatePresence>
        {showStoryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0b0c0f] border border-white/10 w-full max-w-md rounded-3xl p-6 relative shadow-3xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowStoryModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-white">{language === 'es' ? 'Crear Nueva Historia' : 'Create New Ephemeral Story'}</h3>
                <p className="text-xs text-gray-400">
                  {language === 'es' ? 'Selecciona un fondo, asocia una canción e inspira a tu comunidad.' : 'Pick a theme backdrop, link a melody and inspire your fanbase.'}
                </p>
              </div>

              <form onSubmit={handleCreateStorySubmit} className="space-y-4">
                
                {/* Preset backdrop photos selection */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-gray-500">1. Selecciona Fondo Estético (Backdrop)</span>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_STORY_BG_IMAGES.map((img) => (
                      <div 
                        key={img.url}
                        onClick={() => setNewStoryBgUrl(img.url)}
                        className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative ${
                          newStoryBgUrl === img.url ? 'border-primary scale-105 shadow-md shadow-primary/20' : 'border-transparent hov:opacity-85'
                        }`}
                      >
                        <img src={img.url} className="w-full h-full object-cover" alt="" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional attached song picker */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-gray-500">2. Sintoniza una rola (Rola / Song)</span>
                  
                  {selectedMusic ? (
                    <div className="bg-primary/10 border border-primary/25 p-2 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Music size={13} className="text-primary flex-shrink-0" />
                        <span className="text-xs font-bold text-white truncate">{selectedMusic.title} - {selectedMusic.artist}</span>
                      </div>
                      <button type="button" onClick={() => setSelectedMusic(null)} className="text-primary hover:text-white font-black text-xs">✕</button>
                    </div>
                  ) : (
                    <div className="bg-black/35 p-3 rounded-xl border border-white/5 space-y-2">
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={searchSongQuery}
                          onChange={(e) => setSearchSongQuery(e.target.value)}
                          placeholder={language === 'es' ? "Buscar: Bad Bunny, Coldplay..." : "Search song label..."}
                          className="flex-1 bg-white/5 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary border border-white/5"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchSong(); } }}
                        />
                        <button 
                          type="button" 
                          onClick={() => handleSearchSong()}
                          className="bg-white text-black font-black uppercase text-[9px] px-3.5 rounded-lg"
                        >
                          🔍
                        </button>
                      </div>

                      {searching && <span className="text-[9.5px] font-mono block text-gray-500 animate-pulse">Sintonizando...</span>}

                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {searchSongResults.slice(0, 4).map((s, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setSelectedMusic(s)}
                            className="p-1.5 px-2 rounded-lg hover:bg-white/5 cursor-pointer text-[10px] text-white flex justify-between items-center gap-2"
                          >
                            <span className="truncate max-w-[160px]">{s.title} • {s.artist}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                id={`btn-story-preview-${idx}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playTrack(s);
                                }}
                                className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[8px] font-mono"
                              >
                                {language === 'es' ? 'Escuchar' : 'Listen'}
                              </button>
                              <span className="text-[8px] font-mono text-[#00df82] uppercase font-bold">PICK</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Large Preview Area */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-gray-500">3. Vista previa (Live Preview)</span>
                  <div className="relative aspect-[9/16] h-64 mx-auto rounded-xl overflow-hidden border border-white/10 shadow-lg">
                    <img src={newStoryBgUrl} className="w-full h-full object-cover brightness-75" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <img src={ownAvatar} alt="" className="w-6 h-6 rounded-full object-cover border border-white/10" />
                      <span className="text-[10px] font-black text-white">{ownDisplayName}</span>
                    </div>

                    {selectedMusic && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-primary/20 flex items-center gap-1.5 min-w-[140px] justify-center">
                        <Music size={11} className="text-primary" />
                        <div className="text-left">
                          <p className="text-[8.5px] font-black text-white truncate max-w-[100px]">{selectedMusic.title}</p>
                          <p className="text-[7.5px] text-gray-500 font-bold truncate max-w-[100px]">{selectedMusic.artist}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowStoryModal(false)}
                    className="flex-1 bg-white/5 text-white/80 py-2.5 rounded-xl font-bold uppercase text-[10px] transition-all hover:bg-white/10"
                  >
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-primary text-black py-2.5 rounded-xl font-black uppercase text-[10px] transition-all hover:scale-105 shadow-lg shadow-primary/20"
                  >
                    {language === 'es' ? 'Publicar Historia' : 'Publish Story'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story View Screen Overlay Modal */}
      <AnimatePresence>
        {activeStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center select-none"
          >
            {/* Header progress line */}
            <div className="absolute top-4 left-4 right-4 z-20 flex gap-1 h-1">
              <div className="h-full bg-primary rounded-full animate-story-progress flex-1" />
            </div>

            {/* User credentials */}
            <div className="absolute top-8 left-4 right-4 z-20 flex justify-between items-center text-white">
              <div className="flex items-center gap-2.5">
                <img src={activeStory.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-white/5 animate-pulse" />
                <span className="text-xs font-black">{activeStory.user}</span>
                <span className="text-[9px] text-gray-500 font-mono">1h ago</span>
              </div>
              <button 
                onClick={() => setActiveStory(null)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Display */}
            <div className="w-full max-w-lg aspect-[9/16] relative flex items-center justify-center">
              <img src={activeStory.content} alt="" className="w-full h-full object-cover rounded-2xl shadow-2xl brightness-90 border border-white/5" />
              
              {/* Optional tag floating sound label */}
              {activeStory.attachedSong && (
                <div 
                  onClick={() => playTrack({
                    id: '',
                    title: activeStory.attachedSong!,
                    artist: activeStory.attachedArtist || 'Unknown Artist',
                    thumbnail: activeStory.avatar
                  })}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-primary/30 p-2.5 px-4 rounded-full text-center pointer-events-auto cursor-pointer shadow-2xl flex items-center gap-2.5 min-w-[200px]"
                >
                  <Music size={13} className="text-primary animate-pulse" />
                  <div className="text-left">
                    <p className="text-[10px] font-black text-white leading-tight">{activeStory.attachedSong}</p>
                    <p className="text-[8.5px] text-[#00df82] font-semibold tracking-wider leading-none mt-0.5">{activeStory.attachedArtist}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebrating Sweep feedback splash */}
      <AnimatePresence>
        {showStreakModal && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-6"
          >
            <div className="bg-[#0b0c0f]/90 border border-primary/20 p-8 rounded-[36px] max-w-sm text-center space-y-5 relative shadow-3xl overflow-hidden">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="w-20 h-20 bg-primary/20 text-primary border border-primary/20 rounded-full flex items-center justify-center mx-auto shadow-2xl relative">
                <Flame size={40} className="fill-current animate-bounce" />
                <div className="absolute inset-0 bg-primary rounded-full blur-md opacity-30 scale-110" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">{language === 'es' ? '¡Racha Asegurada!' : 'Streak Fueled!'}</h3>
                <p className="text-xs text-gray-400">
                  {language === 'es' 
                    ? `Has aumentado tu racha diaria con ${showStreakModal}. ¡Sigue compartiendo música para ganar insignias!`
                    : `You have stoked your daily visual streak with ${showStreakModal}. Keep sharing to claim badges.`}
                </p>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex justify-between items-center text-xs text-white">
                <span className="font-bold flex items-center gap-1.5"><Award size={14} className="text-yellow-400" /> VibeStreak Level</span>
                <span className="font-black text-primary font-mono">+1 XP Boost</span>
              </div>

              <button 
                onClick={() => setShowStreakModal(null)}
                className="w-full bg-primary text-black font-black uppercase text-xs py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                {language === 'es' ? 'Continuar sintonizando' : 'Continue listening'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
