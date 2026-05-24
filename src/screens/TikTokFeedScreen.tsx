import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MessageCircle, Share2, Play, Pause, Bookmark, Music2, Sparkles, Send, 
  ChevronRight, Volume2, VolumeX, Eye, Flame, Award, HelpCircle
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { youtubeService, YouTubeTrack } from '../services/youtubeService';

interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
}

const TEMPLATE_LYRICS: Record<string, string> = {
  'colapso': `[00:01] Ed Maverick - Colapso
[00:08] Diosito, por favor
[00:12] Préstame a tu hijo
[00:15] Para pedirle perdón
[00:20] Ya no puedo ver su rostro
[00:24] Sin sentirme culpable
[00:28] De todo este colapso...
[00:35] Y hoy me encuentro aquí
[00:39] Buscando mil maneras
[00:43] De volverte a hacer sonreír
[00:49] Aunque sé que ya es tarde
[00:54] Para arreglar lo que rompí
[01:00] Diosito dame fuerzas
[01:05] Que ya no puedo más...`,
  'fuentes de ortiz': `[00:01] Ed Maverick - Fuentes de Ortiz
[00:10] Ya me enteré que hay alguien más
[00:15] Que te está robando el sueño
[00:20] Dime si es de verdad
[00:24] Si él te da lo que no di
[00:30] Solo quiero saber si me extrañas
[00:35] O si ya te olvidaste de mí
[00:41] Porque yo sigo aquí
[00:46] En las fuentes de Ortiz
[00:50] Esperando volver a verte reír...`,
  'san lucas': `[00:01] Kevin Kaarl - San Lucas
[00:23] Dile ya, a tus papás, que no vas a regresar
[00:28] Te vas con un loco que no te para de amar
[00:33] A vivir salvajes, libres, libres allá en San Lucas
[00:39] Tus ojos brillan más que la luna, sol y mar
[00:44] Quiero desnudar tu alma y dedicarle una canción
[00:49] Darle todo mi cariño y entregarle mi amor`,
  'ropa de bazar': `[00:01] Ed Maverick - Ropa de Bazar
[00:02] Vámonos de aquí
[00:09] Acompáñame
[00:14] Yo te cuidaré
[00:19] Como en las pedas y todo lo demás
[00:25] Corre y no vuelvas
[00:28] Si quieres te ayudo a escapar
[00:35] Corre, te sigo`,
  'acurrucar': `[00:01] Ed Maverick - Acurrucar
[00:21] ¿Qué esperas de mí?
[00:23] Quiero ver que piensas tú
[00:30] Me dijiste ayer, güey cero romántico
[00:40] Tienes que entender
[00:43] No soy un güey básico
[00:50] Aunque no te culpo, hay veces en que ni siquiera yo me entiendo`
};

export default function TikTokFeedScreen() {
  const { currentTrack, playTrack, isPlaying, togglePlay, currentTime, duration, seekTo, language, fallbackMap, posts } = usePlayer();
  const [youtubeFeedTracks, setYoutubeFeedTracks] = useState<YouTubeTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [likedList, setLikedList] = useState<Record<string, boolean>>({});
  const [savedList, setSavedList] = useState<Record<string, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [popHearts, setPopHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showShareNotification, setShowShareNotification] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPlayedTrackIdRef = useRef<string | null>(null);

  // Memoize feedTracks combined with custom social user posts that have music attached!
  const feedTracks = React.useMemo(() => {
    const userUploadedTracks: YouTubeTrack[] = (posts || [])
      .filter((p: any) => p.music)
      .map((p: any) => ({
        id: p.music.id || p.id,
        title: p.music.title,
        artist: p.music.artist || p.user,
        thumbnail: p.image || p.music.thumbnail || p.avatar,
        duration: '03:15',
        isUserUploaded: true,
        userDisplayName: p.user,
        descriptionText: p.text,
        userAvatar: p.avatar
      }));

    return [...userUploadedTracks, ...youtubeFeedTracks];
  }, [posts, youtubeFeedTracks]);

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      try {
        // Diverse worldwide artists pool from different continents & genres!
        const globalArtists = [
          'Billie Eilish', 'Bad Bunny', 'The Weeknd', 'Taylor Swift', 'Rosalía', 
          'Drake', 'Coldplay', 'Daft Punk', 'Olivia Rodrigo', 'Kendrick Lamar', 
          'Dua Lipa', 'Harry Styles', 'Travis Scott', 'Feid', 'Quevedo', 
          'Karol G', 'Eminem', 'Bruno Mars', 'Adele', 'Ed Sheeran', 'SZA',
          'David Guetta', 'Karol G', 'Post Malone', 'SHAKIRA', 'NewJeans'
        ];
        
        // Pick 4 random global artists to ensure outstanding dynamic variety
        const shuffledArtists = [...globalArtists].sort(() => 0.5 - Math.random());
        const selectedArtists = shuffledArtists.slice(0, 4);

        const promises = [
          ...selectedArtists.map(artist => youtubeService.getPlayableTracks(artist)),
          youtubeService.getTrending()
        ];

        const results = await Promise.allSettled(promises);
        
        let tracks: YouTubeTrack[] = [];
        results.forEach((res) => {
          if (res.status === 'fulfilled') {
            tracks.push(...res.value);
          }
        });

        // Double check details & client-side filter to strictly enforce single songs only
        const hasPlaylistKeywords = (title: string, duration?: string) => {
          const lower = title.toLowerCase();
          const blacklist = [
            "mix", "playlist", "compilación", "compilacion", "compilation", 
            "completo", "full album", "album completo", "álbum completo", 
            "1 hora", "1 hour", "2 horas", "2 hours", "3 horas", "3 hours", 
            "lofi room", "colección", "coleccion", "sus mejores exitos", "sus mejores éxitos",
            "grandes exitos", "grandes éxitos", "discografía", "discografia", "best songs",
            "top tracks", "all songs", "completa", "exitos", "éxitos", "lofi mix", "chill mix",
            "disco completo", "lofi playlist", "canciones completas", "álbumes", "albumes"
          ];
          if (blacklist.some(keyword => lower.includes(keyword))) return true;
          
          if (duration) {
            const colons = (duration.match(/:/g) || []).length;
            if (colons >= 2) return true;
            if (colons === 1) {
              const minutes = parseInt(duration.split(':')[0], 10);
              if (!isNaN(minutes) && minutes >= 10) return true;
            }
          }
          return false;
        };

        const filteredTracks = tracks.filter(t => !hasPlaylistKeywords(t.title, t.duration));

        // Filter out duplicates and take the first 15 original tracks
        const uniqueTracks = filteredTracks.filter((t, i, self) => 
          self.findIndex((val) => val.id === t.id) === i
        ).slice(0, 15);

        setYoutubeFeedTracks(uniqueTracks);
        
        // Initialize reactive metrics
        const initialLikes: Record<string, number> = {};
        const initialComments: Record<string, Comment[]> = {};
        uniqueTracks.forEach((track) => {
          initialLikes[track.id] = Math.floor(Math.random() * 8000) + 1200;
          initialComments[track.id] = [
            {
              id: '1',
              user: 'Billie Eilish',
              avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&q=80',
              text: language === 'es' ? 'Ufff esta canción me llega al alma profunda... 😭😭🔥' : 'Man this track speaks directly to my soul 😭😭🔥',
              time: '2h',
              likes: 420
            },
            {
              id: '2',
              user: 'Bad Bunny',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&q=80',
              text: language === 'es' ? 'Sintonizado desde las playas del Caribe, durísimo' : 'Listening with sunrise sea vibes, incredible',
              time: '4h',
              likes: 198
            },
            {
              id: '3',
              user: 'Rosalía',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80',
              text: language === 'es' ? 'La sincronización de la letra está impecable en la app, gran trabajo!' : 'The lyrics syncing with the track is flawless',
              time: '1d',
              likes: 540
            }
          ];
        });
        setLikesCount(initialLikes);
        setCommentsMap(initialComments);

      } catch (err) {
        console.error('Failed to load feed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, [language]);

  // Synchronize playing active feed track
  useEffect(() => {
    if (feedTracks.length > 0 && feedTracks[activeIndex]) {
      const targetTrack = feedTracks[activeIndex];
      const activeId = fallbackMap[targetTrack.id]?.id || targetTrack.id;
      
      if (lastPlayedTrackIdRef.current !== targetTrack.id) {
        lastPlayedTrackIdRef.current = targetTrack.id;
        if (currentTrack?.id !== activeId) {
          playTrack(targetTrack);
        }
      }
    }
  }, [activeIndex, feedTracks, currentTrack?.id, fallbackMap, playTrack]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const height = e.currentTarget.clientHeight;
    if (height > 0) {
      const index = Math.round(scrollTop / height);
      if (index >= 0 && index < feedTracks.length && index !== activeIndex) {
        setActiveIndex(index);
      }
    }
  };

  const currentActiveTrack = feedTracks[activeIndex];

  const handleDoubleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentActiveTrack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add heart animation
    const newHeart = { id: Date.now(), x, y };
    setPopHearts((prev) => [...prev, newHeart]);
    
    if (!likedList[currentActiveTrack.id]) {
      setLikedList((prev) => ({ ...prev, [currentActiveTrack.id]: true }));
      setLikesCount((prev) => ({ ...prev, [currentActiveTrack.id]: (prev[currentActiveTrack.id] || 0) + 1 }));
    }

    setTimeout(() => {
      setPopHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1000);
  };

  const handleLikeToggle = () => {
    if (!currentActiveTrack) return;
    const isLiked = likedList[currentActiveTrack.id];
    setLikedList((prev) => ({ ...prev, [currentActiveTrack.id]: !isLiked }));
    setLikesCount((prev) => ({
      ...prev,
      [currentActiveTrack.id]: isLiked 
        ? prev[currentActiveTrack.id] - 1 
        : prev[currentActiveTrack.id] + 1
    }));
  };

  const handleSaveToggle = () => {
    if (!currentActiveTrack) return;
    setSavedList((prev) => ({
      ...prev,
      [currentActiveTrack.id]: !prev[currentActiveTrack.id]
    }));
  };

  const handleShareClick = () => {
    if (!currentActiveTrack) return;
    const songUrl = `https://vibesonic.app/track/${currentActiveTrack.id}`;
    navigator.clipboard.writeText(songUrl);
    setShowShareNotification(true);
    setTimeout(() => setShowShareNotification(false), 2500);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentActiveTrack) return;
    
    const userComment: Comment = {
      id: Date.now().toString(),
      user: 'Sandra_Dev',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      text: newCommentText.trim(),
      time: '1s',
      likes: 0
    };

    setCommentsMap((prev) => ({
      ...prev,
      [currentActiveTrack.id]: [userComment, ...(prev[currentActiveTrack.id] || [])]
    }));
    setNewCommentText('');
  };

  // Synced Lyrics computation matching actual database LRC
  const parsedLyrics = React.useMemo(() => {
    if (!currentActiveTrack) return [];
    
    const trackTitleLower = currentActiveTrack.title.toLowerCase();
    let lrcString = '';
    
    // Check if we have template synced lyrics configured
    for (const key of Object.keys(TEMPLATE_LYRICS)) {
      if (trackTitleLower.includes(key)) {
        lrcString = TEMPLATE_LYRICS[key];
        break;
      }
    }
    
    // Default fallback synced lyrics if no match
    if (!lrcString) {
      lrcString = `[00:01] ${currentActiveTrack.title}
[00:06] Sintonizando con VibeSonic
[00:11] Sentirás la música fluir
[00:17] En un loop infinito dinámico
[00:23] Desliza para explorar más vibras
[00:29] Letras sincronizadas en tu cel...`;
    }

    const lines = lrcString.split('\n');
    const parsed: { time: number; text: string }[] = [];
    const regex = /\[(\d+):(\d+(?:\.\d+)?)\]/;

    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseFloat(match[2]);
        parsed.push({
          time: min * 60 + sec,
          text: line.replace(regex, '').trim()
        });
      }
    }
    return parsed.sort((a, b) => a.time - b.time);
  }, [currentActiveTrack]);

  const activeLyricIndex = React.useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    let activeIdx = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
        if (currentTime >= parsedLyrics[i].time) {
          activeIdx = i;
        } else {
          break;
        }
    }
    return activeIdx;
  }, [parsedLyrics, currentTime]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#050505]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(3,221,130,0.3)] mb-4" />
        <span className="text-xs font-mono font-bold tracking-widest text-primary animate-pulse">
          {language === 'es' ? 'CONSTRUYENDO FEED ALGORÍTMICO...' : 'CONSTRUCTING ALGORITHMIC FEED...'}
        </span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] md:h-[750px] relative w-full bg-[#030303] rounded-3xl overflow-hidden border border-white/5 flex flex-col md:max-w-md mx-auto shadow-2xl">
      
      {/* Scrollable Container mimicking mobile viewports */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative h-full select-none"
        style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {feedTracks.map((track, idx) => {
          const isSelected = idx === activeIndex;
          const isLiked = likedList[track.id];
          const isSaved = savedList[track.id];
          const likesCountVal = likesCount[track.id] || 3200;
          const commentsCount = commentsMap[track.id]?.length || 3;

          return (
            <div 
              key={track.id} 
              className="h-full w-full snap-start snap-always relative flex-shrink-0 flex flex-col justify-end text-white"
              style={{ minHeight: '100%' }}
            >
              {/* Immersive blurred overlay from video art */}
              <div className="absolute inset-0 z-0 select-none pointer-events-none">
                <img 
                  src={track.thumbnail} 
                  alt="" 
                  className="w-full h-full object-cover brightness-[0.35]" 
                  referrerPolicy="no-referrer"
                />
                
                {/* Dynamic gradient overlay to read text perfectly */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#04040a]/95" />
                
                {/* Neon Aura ambient light reflecting current state */}
                <div 
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-40 mix-blend-screen transition-all duration-[1500ms] ${
                    isPlaying && isSelected ? 'scale-125 animate-pulse' : 'scale-75'
                  }`}
                  style={{ backgroundColor: isLiked ? '#ff2e54' : '#00df82' }}
                />
              </div>

              {/* Tap container for Double-Click to Like and Single-Click to Toggle Play */}
              <div 
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={togglePlay}
                onDoubleClick={handleDoubleTap}
              />

              {/* Floating Double Tap Hearts */}
              {popHearts.map((heart) => (
                <motion.div
                  key={heart.id}
                  initial={{ scale: 0, opacity: 1, y: heart.y }}
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 1, 0], y: heart.y - 100 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute pointer-events-none z-30"
                  style={{ left: heart.x - 24, top: heart.y - 24 }}
                >
                  <Heart size={48} fill="#ff2e54" className="text-[#ff2e54] drop-shadow-[0_0_15px_rgba(255,46,84,0.6)]" />
                </motion.div>
              ))}

              {/* Synced Lyrics HUD overlay (Floating slightly above controls) */}
              {isSelected && parsedLyrics.length > 0 && (
                <div className="absolute top-16 left-4 right-16 z-20 pointer-events-none space-y-1 bg-black/25 backdrop-blur-sm p-3 rounded-xl border border-white/5 max-h-[120px] overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles size={11} className="text-primary animate-pulse" />
                    <span className="text-[8px] font-mono font-bold tracking-widest text-[#00df82] uppercase">
                      {language === 'es' ? 'Letra Sincronizada' : 'LRC Real-Time Sync'}
                    </span>
                  </div>
                  {parsedLyrics.slice(Math.max(0, activeLyricIndex - 1), Math.min(parsedLyrics.length, activeLyricIndex + 2)).map((line, lIdx) => {
                    const actualIdx = parsedLyrics.findIndex((a) => a.text === line.text);
                    const isLineActive = actualIdx === activeLyricIndex;
                    
                    return (
                      <motion.p 
                        key={lIdx}
                        animate={{ opacity: isLineActive ? 1 : 0.35, scale: isLineActive ? 1.02 : 0.95 }}
                        className={`text-xs md:text-sm font-black transition-all truncate leading-tight ${
                          isLineActive ? 'text-primary' : 'text-white'
                        }`}
                        style={{
                          textShadow: isLineActive ? '0 0 10px rgba(0,223,130,0.4)' : 'none'
                        }}
                      >
                        {line.text}
                      </motion.p>
                    );
                  })}
                </div>
              )}

              {/* Right Sidebar Control Actions (TikTok style) */}
              <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-5">
                
                {/* Artist Spinning Avatar */}
                <motion.div 
                  animate={{ rotate: isPlaying && isSelected ? 360 : 0 }}
                  transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    playTrack(track);
                  }}
                  className="w-12 h-12 rounded-full border-2 border-primary/80 overflow-hidden shadow-[0_0_15px_rgba(0,223,130,0.3)] ring-2 ring-black cursor-pointer bg-black/60 relative group"
                >
                  <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={10} fill="white" />
                  </div>
                </motion.div>

                {/* Like Button */}
                <div className="flex flex-col items-center text-center">
                  <motion.button 
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); handleLikeToggle(); }}
                    className={`w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-pointer hover:bg-black/60 ${
                      isLiked ? 'text-[#ff2e54]' : 'text-white'
                    }`}
                  >
                    <Heart size={20} fill={isLiked ? '#ff2e54' : 'none'} className={isLiked ? 'animate-ping-once' : ''} />
                  </motion.button>
                  <span className="text-[10px] font-mono font-black tracking-wide mt-1 drop-shadow-md">
                    {likesCountVal.toLocaleString()}
                  </span>
                </div>

                {/* Comment Button Column */}
                <div className="flex flex-col items-center text-center">
                  <motion.button 
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                    className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-pointer hover:bg-black/60 text-white"
                  >
                    <MessageCircle size={20} />
                  </motion.button>
                  <span className="text-[10px] font-mono font-black tracking-wide mt-1 drop-shadow-md">
                    {commentsCount}
                  </span>
                </div>

                {/* Save to Playlist Playlist Bookmark */}
                <div className="flex flex-col items-center text-center">
                  <motion.button 
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); handleSaveToggle(); }}
                    className={`w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-pointer hover:bg-black/60 ${
                      isSaved ? 'text-yellow-400' : 'text-white'
                    }`}
                  >
                    <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                  </motion.button>
                  <span className="text-[9px] font-black tracking-wider uppercase mt-1 drop-shadow-md">
                    {isSaved ? 'Saved' : 'Save'}
                  </span>
                </div>

                {/* Share Button with link copying */}
                <div className="flex flex-col items-center text-center">
                  <motion.button 
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); handleShareClick(); }}
                    className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-pointer hover:bg-black/60 text-white"
                  >
                    <Share2 size={20} />
                  </motion.button>
                  <span className="text-[9px] font-black tracking-wider uppercase mt-1 drop-shadow-md">
                    Share
                  </span>
                </div>
              </div>

              {/* Left-aligned Core Music and Album Metadata Detail Panel */}
              <div className="absolute left-4 bottom-6 right-20 z-20 pointer-events-none select-text space-y-2.5 w-[calc(100%-100px)]">
                <div className="space-y-1">
                  {(track as any).isUserUploaded ? (
                    <div className="bg-black/50 backdrop-blur-md p-3 rounded-2xl border border-primary/25 space-y-1.5 pointer-events-auto">
                      <div className="flex items-center gap-1.5 w-full">
                        <img 
                          src={(track as any).userAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=40&q=80'} 
                          className="w-5 h-5 rounded-full object-cover border border-primary" 
                          alt="" 
                        />
                        <span className="text-xs font-black text-primary truncate max-w-[100px]">
                          {(track as any).userDisplayName || 'You'}
                        </span>
                        <span className="text-[7px] font-mono leading-none tracking-widest uppercase bg-primary/20 border border-primary/30 text-primary px-1 py-0.5 rounded font-black flex-shrink-0">
                          POST CO-OP
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white leading-normal line-clamp-3">
                        {(track as any).descriptionText}
                      </p>
                      <div className="flex items-center gap-1 pt-1.5 border-t border-white/5 text-[9.5px] text-gray-400 font-bold truncate w-full">
                        <Music2 size={10} className="text-primary animate-pulse" />
                        <span className="truncate">{(track as any).title} • {(track as any).artist}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <motion.h4 
                        layoutId={`title-${track.id}`}
                        className="text-base font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] line-clamp-2 leading-snug"
                      >
                        {track.title}
                      </motion.h4>
                      <p className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        {track.artist}
                      </p>
                    </>
                  )}
                </div>

                {/* Simulated playback controls for feed page */}
                {isSelected && (
                  <div className="flex items-center gap-3 bg-black/25 backdrop-blur-sm p-2 rounded-lg border border-white/5 max-w-max pointer-events-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                      className="p-1 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all"
                    >
                      {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <span className="text-[9px] font-mono text-gray-400">
                      {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
                    </span>
                    <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(currentTime / (duration || 200)) * 100}%` }} />
                    </div>
                  </div>
                )}

                {/* Floating "Viral" scrolling ticker of the track */}
                <div className="flex items-center gap-2 text-[10px] text-gray-300 font-bold font-mono">
                  <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/5 shadow-md">
                    <Music2 size={11} className="text-primary" />
                    <marquee className="w-24 uppercase tracking-[0.1em]">{track.title} • {track.artist}</marquee>
                  </div>
                  <div className="flex items-center gap-1 bg-[#12151c]/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/5 shadow-md text-red-400">
                    <Flame size={10} className="fill-current animate-pulse" />
                    <span>#VibeTrending</span>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Floating notification for quick copied content */}
      <AnimatePresence>
        {showShareNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 bg-primary text-black text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-2xl z-50 flex items-center gap-1.5 border border-primary/20"
          >
            <Sparkles size={11} />
            {language === 'es' ? 'Vínculo copiado al portapapeles!' : 'Link copied to clipboard!'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Drawer Sheet for Comments Simulator */}
      <AnimatePresence>
        {showComments && currentActiveTrack && (
          <>
            {/* Dark blur backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowComments(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 pointer-events-auto"
            />
            
            {/* Sheet sliding up */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 h-[60%] bg-[#0d0f14] border-t border-white/10 rounded-t-[28px] overflow-hidden z-40 flex flex-col pointer-events-auto shadow-3xl"
            >
              {/* Grab Drag Bar and Header */}
              <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto absolute top-2.5 left-1/2 -translate-x-1/2" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {language === 'es' ? 'Comentarios' : 'Comments'} ({commentsMap[currentActiveTrack.id]?.length || 0})
                </span>
                <button 
                  onClick={() => setShowComments(false)}
                  className="text-gray-500 hover:text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>

              {/* Lists of comments */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {(commentsMap[currentActiveTrack.id] || []).length > 0 ? (
                  commentsMap[currentActiveTrack.id].map((comm) => (
                    <div key={comm.id} className="flex gap-3">
                      <img src={comm.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-white/5" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-primary">{comm.user}</span>
                          <span className="text-[9px] text-gray-500 font-mono">{comm.time}</span>
                        </div>
                        <p className="text-xs text-white/90 leading-relaxed font-sans">{comm.text}</p>
                        
                        <div className="flex items-center gap-1.5 pt-1 text-[9px] text-gray-500 font-bold hover:text-white transition-colors cursor-pointer">
                          <Heart size={10} />
                          <span>{comm.likes} likes</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-gray-500 space-y-1">
                    <p className="font-bold text-sm">No comments yet</p>
                    <p className="text-xs">Be the first to share your vibes about this track!</p>
                  </div>
                )}
              </div>

              {/* Comment sender form */}
              <form onSubmit={handleAddComment} className="p-3 border-t border-white/5 bg-black/40 flex items-center gap-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <input 
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={language === 'es' ? "Añadir comentario..." : "Add to the discussion..."}
                  className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/25 placeholder:text-gray-500 text-white"
                />
                <button 
                  type="submit"
                  className="w-10 h-10 bg-primary rounded-xl text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                >
                  <Send size={15} />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
