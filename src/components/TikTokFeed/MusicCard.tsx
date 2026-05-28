import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MessageCircle, Send, Play, Pause, X, Sparkles, Loader2, Disc, Star
} from 'lucide-react';
import { VideoManager } from './VideoManager';
import { FeedItem, LyricLine, Comment } from './types';
import { usePlayer } from '../../context/PlayerContext';

interface MusicCardProps {
  item: FeedItem;
  idx: number;
  isSelected: boolean;
  isNear: boolean;
  activeTrackPlaying: boolean;
  currentTime: number;
  duration: number;
  seekTo: (time: number) => void;
  playTrack: (track: { id: string; title: string; artist: string; thumbnail: string }) => void;
  currentTrackId?: string;
  itemLyrics: LyricLine[];
  progress: number;
  formatTime: (seconds: number) => string;
}

// Robust LRC Synced Lyrics parser utility
const parseLrc = (lrcText: string): LyricLine[] => {
  if (!lrcText) return [];
  const lines = lrcText.split(/\r?\n/);
  const parsed: LyricLine[] = [];
  const timeRegex = /\[(\d+):(\d+(?:\.\d+)?)\]/;
  
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const timeInSecs = minutes * 60 + seconds;
      const text = trimmed.replace(timeRegex, "").trim();
      parsed.push({ time: timeInSecs, text });
    }
  }
  return parsed.sort((a, b) => a.time - b.time);
};

export const MusicCard: React.FC<MusicCardProps> = ({
  item,
  idx,
  isSelected,
  isNear,
  activeTrackPlaying,
  currentTime,
  duration,
  seekTo,
  playTrack,
  currentTrackId,
  itemLyrics,
  progress,
  formatTime,
}) => {
  const { notify } = usePlayer();
  const [loadedLyrics, setLoadedLyrics] = useState<LyricLine[]>(itemLyrics || []);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const hasSeekedToVoiceRef = useRef<string | null>(null);

  // Generate authentic mock comments when drawer is opened
  useEffect(() => {
    if (showComments && localComments.length === 0) {
      setLocalComments([
        {
          id: '1',
          user: `${item.artist.toLowerCase().replace(/[^a-z0-str]/g, '')}_fan_99`,
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80`,
          text: `¡Esta canción me toca el alma directamente! La combinación de ritmo e historia es perfecta. ❤️🔥`,
          time: 'Hace 2 horas',
          likes: 412
        },
        {
          id: '2',
          user: 'melomano_del_dia',
          avatar: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80`,
          text: `La producción acústica es soberbia. ¡Un aplauso para este artista!`,
          time: 'Hace 5 horas',
          likes: 231
        },
        {
          id: '3',
          user: 'lyrics_tracker',
          avatar: `https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80`,
          text: `Las letras sincronizadas karaoke se ven increíbles, la estética glassmorphism está perfecta. ✨`,
          time: 'Hace 1 día',
          likes: 85
        }
      ]);
    }
  }, [showComments, item.artist, localComments.length]);

  // Dynamically load lyrics only when card is NEAR to optimize resources and network bandwidth
  useEffect(() => {
    if (!isNear) return;

    let active = true;
    const fetchLyrics = async () => {
      setLyricsLoading(true);
      try {
        const url = `/api/lyrics?title=${encodeURIComponent(item.songTitle)}&artist=${encodeURIComponent(item.artist)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Lyrics fetch failed');
        const data = await response.json();
        
        if (active) {
          const rawLyrics = data.syncedLyrics || data.lyrics;
          if (rawLyrics && rawLyrics.trim()) {
            const parsed = parseLrc(rawLyrics);
            if (parsed.length > 0) {
              setLoadedLyrics(parsed);
              return;
            }
          }
          
          const plainText = data.plainLyrics || data.lyrics;
          if (plainText && plainText.trim() && !plainText.includes("No se encontraron letras")) {
            const lines = plainText
              .split('\n')
              .map((l: string) => l.trim())
              .filter((l: string) => l.length > 0 && !l.startsWith('['));
            
            const autoTimed = lines.map((line: string, index: number) => ({
              time: index * 4,
              text: line,
            }));
            setLoadedLyrics(autoTimed);
          } else {
            setLoadedLyrics([
              { time: 0, text: `🎵 ${item.songTitle}` },
              { time: 3, text: `Bajo la voz original de ${item.artist}` },
              { time: 7, text: "[Acompañamiento instrumental e inicio de melodía]" }
            ]);
          }
        }
      } catch (err) {
        console.warn('Error fetching lyrics inside feed card:', err);
        if (active) {
          setLoadedLyrics([
            { time: 0, text: `🎵 ${item.songTitle} - ${item.artist}` },
            { time: 4, text: "[Disfruta la melodía original en alta fidelidad]" }
          ]);
        }
      } finally {
        if (active) setLyricsLoading(false);
      }
    };

    fetchLyrics();

    return () => {
      active = false;
    };
  }, [item.songTitle, item.artist, isNear]);

  // Automatic "Skip Intro" logic: seeks straight to the first vocal line once track plays!
  useEffect(() => {
    if (isSelected && loadedLyrics.length > 0 && currentTrackId === item.audioUrl) {
      if (hasSeekedToVoiceRef.current !== item.audioUrl) {
        hasSeekedToVoiceRef.current = item.audioUrl;

        // Skip to first line with valid time and text that isn't empty or instrumental
        const vocalLine = loadedLyrics.find(line => 
          line.time > 1 && 
          line.text.trim().length > 0 && 
          !line.text.toLowerCase().includes('instrumental') &&
          !line.text.toLowerCase().includes('intro') &&
          !line.text.toLowerCase().includes('[')
        ) || loadedLyrics[0];

        // Seek seamlessly to when the vocal part enters
        if (vocalLine && vocalLine.time > 0) {
          console.log(`Autoplay skip intro triggered! Seeking to ${vocalLine.time}s - "${vocalLine.text}"`);
          seekTo(vocalLine.time);
        }
      }
    }
  }, [isSelected, loadedLyrics, currentTrackId, item.audioUrl, seekTo]);

  // Active lyric line index calculations
  const activeLineIndex = useMemo(() => {
    if (loadedLyrics.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < loadedLyrics.length; i++) {
      if (currentTime >= loadedLyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [loadedLyrics, currentTime]);

  // Scroll current line to exactly inside the viewport
  useEffect(() => {
    if (isSelected && activeLineIndex !== -1 && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeEl = container.querySelector(`[data-lyric-idx="${activeLineIndex}"]`);
      if (activeEl) {
        const containerHeight = container.clientHeight;
        const elOffsetTop = (activeEl as HTMLElement).offsetTop;
        const elHeight = (activeEl as HTMLElement).clientHeight;

        container.scrollTo({
          top: elOffsetTop - containerHeight / 2 + elHeight / 2,
          behavior: 'smooth',
        });
      }
    }
  }, [activeLineIndex, isSelected]);

  // Handle like button press with spring animations
  const handleLikeToggle = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
    } else {
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
    }
  };

  // Construct sharing dynamic link and write to clipboard
  const handleShareClick = () => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?song=${item.postId}`;
      navigator.clipboard.writeText(shareUrl);
      notify('¡Enlace directo grabado! Compártelo con quien quieras. 🚀', 'success');
    } catch (err) {
      console.warn('Share copy failed', err);
      notify('No se pudo copiar el enlace, intenta copiar la URL actual.', 'info');
    }
  };

  // Format likes counter to clean text
  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    seekTo(percentage * duration);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const posted: Comment = {
      id: Date.now().toString(),
      user: 'tú_music_fan',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      text: newComment.trim(),
      time: 'Ahora mismo',
      likes: 0
    };

    setLocalComments(prev => [posted, ...prev]);
    setNewComment('');
  };

  // VIRTUALIZED SKELETON: Yields incredible performance, 60+ Frame Rate, zero cellular lag
  if (!isNear) {
    return (
      <div
        data-snap-slide="true"
        data-index={idx.toString()}
        className="h-full w-full snap-start snap-always relative flex-shrink-0 flex items-center justify-center bg-black overflow-hidden"
        style={{ minHeight: '100vh' }}
      >
        <div 
          className="relative w-full max-w-[calc(100vh*9/16)] h-full overflow-hidden flex flex-col items-center justify-center bg-[#010a04] border border-[#00df82]/5"
        >
          <img
            src={item.coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-10 filter blur-[80px]"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col items-center gap-3 z-10 text-center px-6">
            <Disc className="w-12 h-12 text-[#00df82]/20 animate-spin" style={{ animationDuration: '6s' }} />
            <p className="text-white/40 text-sm font-black tracking-wide uppercase">{item.songTitle}</p>
            <p className="text-white/20 text-xs font-bold">{item.artist}</p>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE RENDER CELL
  return (
    <div
      data-snap-slide="true"
      data-index={idx.toString()}
      className="h-full w-full snap-start snap-always relative flex-shrink-0 flex items-center justify-center bg-black text-white overflow-hidden"
      style={{ minHeight: '100vh' }}
    >
      {/* 9:16 Full Screen Container (No Deformation, Real Full Screen) */}
      <div 
        className="relative w-full max-w-[calc(100vh*9/16)] h-full overflow-hidden flex flex-col justify-center items-center select-none shadow-[2px_12px_100px_rgba(0,0,0,0.85)] border border-white/5"
        style={{
          background: 'radial-gradient(circle at center, #011306 0%, #000702 100%)'
        }}
      >
        
        {/* Invisible YouTube Background Player Hook */}
        <VideoManager
          videoId={item.audioUrl}
          isActive={isSelected}
          isPlaying={activeTrackPlaying}
          currentTime={currentTime}
        />

        {/* Ambient Cinematographic Blur Background (Uncompromised 9:16 object-cover aspect-ratio) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none z-0">
          <img
            src={item.coverUrl}
            alt=""
            className={`w-full h-full object-cover scale-150 filter blur-[90px] transition-all duration-1000 origin-center ${
              isSelected ? 'opacity-[0.24]' : 'opacity-10'
            }`}
            referrerPolicy="no-referrer"
          />
          {/* Subtle Vignette Gradient Masks */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#000501]/90 via-transparent to-[#000501]/95 mix-blend-multiply" />
          <div className="absolute inset-x-0 -top-1/4 h-[80%] bg-[#00df82]/10 blur-[130px] rounded-full animate-pulse style-s-glow" />
          <div className="absolute inset-x-0 -bottom-1/4 h-[60%] bg-[#00df82]/6 blur-[110px] rounded-full" />
        </div>

        {/* ========================================================
            CENTRAL GLASSMORPHIC MASTER PANEL (Center aligned perfectly)
            ========================================================= */}
        <div className="relative w-[92%] h-[80vh] rounded-[40px] px-6 py-7 backdrop-blur-3xl bg-neutral-950/50 border border-white/[0.08] flex flex-col justify-between items-center z-10 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_25px_65px_rgba(0,0,0,0.8)]">
          
          {/* Decorative ambient color node in glass panel */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00df82]/10 blur-[50px] rounded-full pointer-events-none" />
          
          {/* 1. Header (Cover Art + Titles) */}
          <div className="relative w-full flex flex-col items-center flex-shrink-0 text-center gap-4 mt-2">
            
            {/* Cinematic Large Cover Art with Glass bezel and Halo shadow */}
            <div className="relative flex items-center justify-center">
              {/* Blurred halo backdrop behind cover */}
              <div 
                className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-cover bg-center filter blur-xl opacity-[0.55] transition-transform duration-1000 mix-blend-screen scale-110 active-spin"
                style={{ 
                  backgroundImage: `url(${item.coverUrl})`,
                  animation: activeTrackPlaying ? 'spin 20s linear infinite' : 'none'
                }}
              />
              
              {/* Thick glassmorphic bezel and card wrapper */}
              <motion.div 
                className="relative p-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-2xl overflow-hidden z-10 flex items-center justify-center cursor-pointer"
                animate={activeTrackPlaying ? { scale: [0.97, 1.03, 0.97] } : { scale: 1 }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
              >
                <img
                  src={item.coverUrl}
                  alt={item.songTitle}
                  className={`w-28 h-28 xs:w-32 xs:h-32 sm:w-36 sm:h-36 rounded-full object-cover border-[3px] border-neutral-950/80 shadow-[0_8px_30px_rgba(0,0,0,0.9)] ${
                    activeTrackPlaying ? 'animate-slow-spin' : ''
                  }`}
                  style={{ animationDuration: '24s' }}
                  referrerPolicy="no-referrer"
                />
                
                {/* Micro center hole to emulate vinyl */}
                <div className="absolute w-3 h-3 rounded-full bg-black border border-neutral-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] z-20" />
              </motion.div>
            </div>

            {/* Song title and Artist metadata */}
            <div className="w-full px-2">
              <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-white tracking-tight leading-tight uppercase line-clamp-1">
                {item.songTitle}
              </h3>
              <p className="text-xs sm:text-sm font-black text-[#00df82] tracking-widest uppercase mt-1">
                {item.artist}
              </p>
            </div>
          </div>

          {/* 2. Lyrics Overlay (Fills the center vertical body, completely interactive) */}
          <div className="relative w-full flex-1 min-h-[150px] my-4 overflow-hidden rounded-2xl flex flex-col justify-center">
            
            {lyricsLoading && loadedLyrics.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 text-white/30 font-mono text-[10px] uppercase tracking-widest py-14">
                <Loader2 className="w-5 h-5 text-[#00df82] animate-spin" />
                <span>Cargando Letras Sincronizadas</span>
              </div>
            ) : (
              <div
                ref={lyricsContainerRef}
                className="w-full h-full overflow-y-auto scrollbar-hide py-14 px-1.5 flex flex-col space-y-7 relative select-none scroll-smooth pointer-events-auto"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 0%, white 32%, white 68%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 32%, white 68%, transparent 100%)',
                }}
              >
                {loadedLyrics.map((line, lIdx) => {
                  const isCurrentLine = isSelected && lIdx === activeLineIndex;
                  return (
                    <button
                      key={lIdx}
                      data-lyric-idx={lIdx}
                      onClick={() => seekTo(line.time)}
                      className={`w-full border-0 bg-transparent text-center font-black transition-all duration-300 transform select-none cursor-pointer focus:outline-none focus:ring-0 active:scale-95 ${
                        isCurrentLine 
                          ? 'text-white text-base xs:text-lg sm:text-xl tracking-tight filter drop-shadow-[0_0_12px_rgba(255,255,255,0.7)] scale-105 opacity-100 py-1 font-black' 
                          : 'text-white/25 hover:text-white/45 text-sm sm:text-base tracking-tight font-black opacity-45'
                      }`}
                    >
                      {line.text}
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Visual bottom scroll cue */}
            {loadedLyrics.length > 0 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none flex items-center justify-center gap-1.5 text-white/15 animate-bounce">
                <Sparkles className="w-3 h-3" />
                <span className="text-[8px] font-mono uppercase tracking-widest">Karaoke Live Sync</span>
              </div>
            )}
          </div>

          {/* 3. Footer Section (Apple Music Spec Timeline & Progress Bar) */}
          <div className="w-full flex-shrink-0 flex flex-col gap-3 pointer-events-auto mt-2">
            
            {/* Timeline Control Interface */}
            <div className="flex flex-col gap-2">
              
              {/* Apple style full range timeline scrubber bar */}
              <div 
                onClick={handleProgressClick}
                className="w-full h-3 group flex items-center cursor-pointer relative"
              >
                <div className="w-full h-[3px] bg-white/10 rounded-full group-hover:h-[4px] relative overflow-hidden transition-all duration-200">
                  <div
                    className="h-full bg-gradient-to-r from-[#00df82] to-emerald-400 absolute left-0 top-0 transition-all duration-100 ease-out shadow-[0_0_6px_rgba(0,223,130,0.6)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                {/* Drag handle button overlay */}
                <div 
                  className="absolute w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-150-shadow shadow-md shadow-black"
                  style={{ left: `calc(${progress}% - 5px)` }}
                />
              </div>

              {/* Time Indicators */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono text-white/40 tracking-wider">
                  {formatTime(currentTime)}
                </span>
                <span className="text-[10px] font-mono text-white/40 tracking-wider">
                  {formatTime(duration || 0)}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================
            TIKTOK STYLE FLOATING VERTICAL SOCIAL ACTIONS (On absolute right)
            ========================================================= */}
        <div className="absolute right-3.5 bottom-[10vh] flex flex-col gap-6 items-center z-20 pointer-events-auto bg-black/35 backdrop-blur-md px-2 py-5 rounded-full border border-white/5 shadow-2xl">
          
          {/* LIKE BUTTON FRAME */}
          <div className="flex flex-col items-center gap-1">
            <motion.button
              onClick={handleLikeToggle}
              className={`w-11 h-11 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                isLiked 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 md:scale-110' 
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'
              }`}
              whileTap={{ scale: 0.8 }}
            >
              <Heart 
                size={18} 
                fill={isLiked ? "currentColor" : "none"} 
                stroke={isLiked ? "none" : "currentColor"}
                className={isLiked ? "animate-wiggle" : ""}
              />
            </motion.button>
            <span className="text-[10px] font-bold font-mono text-white/60 tracking-tighter select-none">
              {formatCount(likeCount)}
            </span>
          </div>

          {/* COMMENTS DRAWER TRIGGER */}
          <div className="flex flex-col items-center gap-1">
            <motion.button
              onClick={() => setShowComments(true)}
              className="w-11 h-11 rounded-full cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center"
              whileTap={{ scale: 0.8 }}
            >
              <MessageCircle size={18} />
            </motion.button>
            <span className="text-[10px] font-bold font-mono text-white/60 tracking-tighter select-none">
              {formatCount(item.comments)}
            </span>
          </div>

          {/* LINK SHARE BUTTON */}
          <div className="flex flex-col items-center gap-1">
            <motion.button
              onClick={handleShareClick}
              className="w-11 h-11 rounded-full cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 text-[#00df82] flex items-center justify-center shadow-lg shadow-[#00df82]/5"
              whileTap={{ scale: 0.8 }}
              title="Compartir link directo"
            >
              <Send size={18} className="translate-x-0.5 -translate-y-0.5 rotate-[-15deg] font-black" />
            </motion.button>
            <span className="text-[9px] font-black font-mono text-[#00df82]/80 uppercase tracking-widest select-none">
              Post
            </span>
          </div>

        </div>

        {/* ========================================================
            TIKTOK STYLE BOTTOM-SHEET COMMENT DRAWER (Within the 9:16 frame)
            ========================================================= */}
        <AnimatePresence>
          {showComments && (
            <>
              {/* Dark overlay backdrop inside card viewport */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowComments(false)}
                className="absolute inset-0 bg-black/70 z-40 pointer-events-auto"
              />

              {/* Sliding Bottom Drawer */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="absolute bottom-0 inset-x-0 h-[52vh] bg-[#0c0f0d] rounded-t-[32px] border-t border-white/10 shadow-[0_-15px_35px_rgba(0,0,0,0.85)] z-50 flex flex-col pointer-events-auto overflow-hidden"
              >
                
                {/* Header of Drawer */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#00df82]" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">
                      Comentarios ({localComments.length})
                    </h4>
                  </div>
                  <button 
                    onClick={() => setShowComments(false)}
                    className="p-1 px-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs border border-white/10"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Comments List scroll items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                  {localComments.map((comment) => (
                    <motion.div 
                      key={comment.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 items-start"
                    >
                      <img 
                        src={comment.avatar} 
                        alt="" 
                        className="w-8 h-8 rounded-full border border-white/10 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-black text-white/80">@{comment.user}</span>
                          <span className="text-[9px] text-white/30 font-bold">{comment.time}</span>
                        </div>
                        <p className="text-xs text-white/90 leading-relaxed mt-1 bg-white/5 p-2 rounded-xl border border-white/[0.04]">
                          {comment.text}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 px-1">
                          <Star size={8} className="text-[#00df82]" />
                          <span className="text-[8px] font-bold text-[#00df82]/70">{comment.likes} likes</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Submit New Comment Input Form bar */}
                <form 
                  onSubmit={handlePostComment}
                  className="p-3 border-t border-white/10 bg-neutral-950 flex gap-2 items-center flex-shrink-0"
                >
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Añadir un comentario honesto..."
                    className="flex-1 text-xs bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-full py-2 px-4 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#00df82] transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-[#00df82] to-emerald-400 text-black text-xs font-black rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                  >
                    Enviar
                  </button>
                </form>

              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
