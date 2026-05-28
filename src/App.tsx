import React, { useState } from 'react';
import { 
  Home, Search, Library, PlayCircle, PauseCircle, Music2, Heart, History, User, PlusSquare,
  ChevronDown, ChevronLeft, MoreHorizontal, SkipBack, SkipForward, Play, Pause, Volume2, Share2,
  Shuffle, Repeat, Repeat1, ListMusic, Volume1, VolumeX, UserPlus, UserCheck, TrendingUp,
  Video, MessageSquare, Menu, Smartphone, X, Flame, ShieldAlert, Cpu, Sparkles, Languages,
  Radio, Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import VideoEditorScreen from './screens/VideoEditorScreen';
import MusicRoomsScreen from './screens/MusicRoomsScreen';
import LibraryScreen from './screens/LibraryScreen';
import StatsScreen from './screens/StatsScreen';
import TikTokFeedScreen from './screens/TikTokFeedScreen';
import SocialScreen from './screens/SocialScreen';
import LiveStreamScreen from './screens/LiveStreamScreen';
import ChatScreen from './screens/ChatScreen';
import CreatePostScreen from './screens/CreatePostScreen';
import ProfileScreen from './screens/ProfileScreen';
import { usePlayer } from './context/PlayerContext';
import { useAppStore } from './store/useAppStore';
import YouTubePlayer from './components/YouTubePlayer';
import { youtubeService } from './services/youtubeService';
import AuthModal from './components/AuthModal';
import { WaveformVisualizer, RotatingVinyl } from './components/AestheticEnhancements';

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

const getTrackGradient = (track: any) => {
  if (!track) return 'radial-gradient(circle at 50% 50%, #111 0%, #000 100%)';
  const str = (track.title + (track.artist || '')).toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = Math.abs((hash * 1.6 + 130) % 360);
  const color1 = `hsla(${h1}, 75%, 14%, 0.85)`;
  const color2 = `hsla(${h2}, 85%, 8%, 0.9)`;
  const color3 = `hsla(${(h1 + 240) % 360}, 90%, 4%, 0.98)`;
  return `radial-gradient(circle at 15% 25%, ${color1} 0%, transparent 60%), radial-gradient(circle at 85% 75%, ${color2} 0%, transparent 65%), radial-gradient(circle at 50% 50%, ${color3} 0%, 100% #020202)`;
};

interface SyncedLine {
  time: number;
  text: string;
}

const parseLrc = (lrcText: string): SyncedLine[] => {
  if (!lrcText) return [];
  const lines = lrcText.split(/\r?\n/);
  const parsed: SyncedLine[] = [];
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

function AppContent() {
  const { 
    currentTrack, 
    isPlaying, 
    playTrack,
    nextTrack,
    prevTrack,
    togglePlay, 
    volume, 
    setVolume, 
    currentTime,
    duration,
    seekTo,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    user, 
    login, 
    logout, 
    toggleLike, 
    likedTracks,
    getLikeCount,
    followedArtists,
    toggleFollowArtist,
    notification,
    notify,
    queue,
    language,
    setLanguage,
    t,
    isAuthModalOpen,
    setAuthModalOpen,
    registerFallback,
    stopTrack,
    posts
  } = usePlayer();

  const { setSoundtrackToUse } = useAppStore();

  const [activeTab, setActiveTab] = useState('feed');
  const activeTabRef = React.useRef(activeTab);
  
  // Stop playback when leaving feed tab
  const prevTabRef = React.useRef(activeTab);
  React.useEffect(() => {
    if (prevTabRef.current === 'feed' && activeTab !== 'feed') {
      stopTrack();
    }
    if (activeTab === 'create' || activeTab === 'editor') {
      stopTrack();
    }
    prevTabRef.current = activeTab;
    activeTabRef.current = activeTab;
  }, [activeTab, stopTrack]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [useDeviceFrame, setUseDeviceFrame] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 640 : false);
  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(typeof window !== 'undefined' && window.innerWidth >= 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Track failed videos and safe consecutive fallbacks to prevent infinite loops
  const failedVideoIdsRef = React.useRef<Set<string>>(new Set());
  const consecutiveFallbackCountRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (currentTrack?.id && !failedVideoIdsRef.current.has(currentTrack.id)) {
      consecutiveFallbackCountRef.current = 0;
    }
  }, [currentTrack?.id]);

  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string>('');
  const [syncedLyrics, setSyncedLyrics] = useState<string | null>(null);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [lyricsAlbum, setLyricsAlbum] = useState<string | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editedLyricsText, setEditedLyricsText] = useState('');
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [activeAura, setActiveAura] = useState('cyber');
  const [lyricsSubTab, setLyricsSubTab] = useState<'letra' | 'feed'>('letra');
  const [lyricsSearchQuery, setLyricsSearchQuery] = useState('');

  const parsedLines = React.useMemo(() => parseLrc(syncedLyrics || ''), [syncedLyrics]);

  const songRelatedPosts = React.useMemo(() => {
    if (!currentTrack) return [];
    
    // Filter posts from context matching current song title or track artist
    const matched = (posts || []).filter(post => {
      if (!post.music) return false;
      const songTitle = post.music.title?.toLowerCase() || '';
      const currentTitle = currentTrack.title?.toLowerCase() || '';
      return songTitle.includes(currentTitle) || currentTitle.includes(songTitle);
    });

    const filterQuery = lyricsSearchQuery.toLowerCase().trim();

    // Default premium preset loops/posts generated specifically for this track
    const presets = [
      {
        id: 'related_1',
        user: '@VaporNeonLoop',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        time: 'Justo ahora',
        text: `✨ El mejor loop de ${currentTrack.title} de ${currentTrack.artist} en 9:16 sincronizado con letras dinámicas y luces neón! #pureaudio #loop`,
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-neon-light-on-a-wet-street-at-night-42233-large.mp4',
        likes: 312,
        comments: 14,
        isLiked: false
      },
      {
        id: 'related_2',
        user: '@AtmosphereArtist',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        time: 'Hace 3h',
        text: `🔮 Me quedé atrapado en esta parte de ${currentTrack.title}. ¿Ya vieron los nuevos subtítulos estroboscópicos? #perfectbloop #viral`,
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        likes: 540,
        comments: 32,
        isLiked: true
      },
      {
        id: 'related_3',
        user: '@CyberPunkVibe',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        time: 'Ayer',
        text: `🎸 Remezclando la producción de ${currentTrack.artist}. Sintonía perfecta con tus audífonos PureAudio encendidos! 🎧⚡`,
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-laser-lights-at-a-music-concert-42111-large.mp4',
        likes: 985,
        comments: 73,
        isLiked: false
      }
    ];

    const combined = [...matched, ...presets];

    if (filterQuery) {
      return combined.filter(post => 
        post.text?.toLowerCase().includes(filterQuery) || 
        post.user?.toLowerCase().includes(filterQuery)
      );
    }

    return combined;
  }, [posts, currentTrack, lyricsSearchQuery]);

  const activeLineIndex = React.useMemo(() => {
    if (parsedLines.length === 0) return -1;
    let activeIndex = -1;
    for (let i = 0; i < parsedLines.length; i++) {
      if (currentTime >= parsedLines[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
    return activeIndex;
  }, [parsedLines, currentTime]);

  const lyricsContainerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (activeLineIndex !== -1 && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeEl = container.querySelector(`[data-lyric-idx="${activeLineIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeLineIndex]);

  // Sparkly floating particles arrays
  const [particles] = useState(() => 
    Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2.5 + 1,
      left: Math.random() * 100,
      animDuration: Math.random() * 12 + 8,
      delay: Math.random() * 4,
    }))
  );

  // Aura details mapping
  const auraColors: Record<string, { radial: string; border: string }> = {
    cyber: { radial: 'radial-gradient(circle at 50% 12%, rgba(0, 223, 130, 0.1) 0%, transparent 65%)', border: '#00df82' },
    cosmic: { radial: 'radial-gradient(circle at 50% 12%, rgba(0, 203, 255, 0.1) 0%, transparent 65%)', border: '#00cbff' },
    phoenix: { radial: 'radial-gradient(circle at 50% 12%, rgba(255, 46, 84, 0.1) 0%, transparent 65%)', border: '#ff2e54' },
    retro: { radial: 'radial-gradient(circle at 50% 12%, rgba(217, 70, 239, 0.1) 0%, transparent 65%)', border: '#d946ef' },
  };

  // Hide introductory splash screen after 1.5s (satisfying transition requirement)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntroActive(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Listen to the stats manual override auras
  React.useEffect(() => {
    const handleAuraChange = (e: any) => {
      if (e.detail) {
        setActiveAura(e.detail);
      }
    };
    window.addEventListener('app-aura-changed', handleAuraChange);
    return () => window.removeEventListener('app-aura-changed', handleAuraChange);
  }, []);

  // Emotional music reactive Aura Mode (auto calibrates overlay according to metadata keywords!)
  React.useEffect(() => {
    if (!currentTrack) return;
    const title = currentTrack.title.toLowerCase();
    const artist = currentTrack.artist.toLowerCase();
    
    // Auto shift auras based on mood keywords
    if (
      title.includes('rain') || title.includes('sad') || title.includes('triste') || 
      title.includes('lluvia') || title.includes('chill') || title.includes('slow') || 
      title.includes('relax') || artist.includes('ed maverick')
    ) {
      setActiveAura('cosmic');
    } else if (
      title.includes('gym') || title.includes('hype') || title.includes('lift') || 
      title.includes('phonk') || title.includes('heavy') || title.includes('electronic') || 
      title.includes('cyber') || title.includes('electro')
    ) {
      setActiveAura('phoenix');
    } else if (
      title.includes('retro') || title.includes('love') || title.includes('amor') || 
      title.includes('pop') || title.includes('classic') || title.includes('rose')
    ) {
      setActiveAura('retro');
    } else {
      setActiveAura('cyber');
    }
  }, [currentTrack?.id]);

  const fetchLyrics = async () => {
    if (!currentTrack) return;
    setShowLyrics(true);
    if (!lyrics && !isLoadingLyrics) {
      setIsLoadingLyrics(true);
      try {
        const result = await youtubeService.getLyrics(currentTrack.title, currentTrack.artist);
        if (result) {
          setLyrics(result.lyrics || '');
          setSyncedLyrics(result.syncedLyrics || null);
          setPlainLyrics(result.plainLyrics || null);
          setIsSynced(!!result.isSynced);
          setLyricsAlbum(result.albumName || null);
        }
      } catch (e) {
        setLyrics('No se encontraron letras disponibles.');
        setSyncedLyrics(null);
        setPlainLyrics('No se encontraron letras disponibles.');
        setIsSynced(false);
        setLyricsAlbum(null);
      } finally {
        setIsLoadingLyrics(false);
      }
    }
  };

  const handleSaveLyrics = async () => {
    if (!currentTrack) return;
    try {
      const success = await youtubeService.saveLyrics(currentTrack.title, currentTrack.artist, editedLyricsText);
      if (success) {
        setLyrics(editedLyricsText);
        const hasTimeStamp = editedLyricsText.includes('[00:') || editedLyricsText.includes('[01:') || editedLyricsText.includes('[');
        if (hasTimeStamp) {
          setSyncedLyrics(editedLyricsText);
          setPlainLyrics(null);
          setIsSynced(true);
        } else {
          setSyncedLyrics(null);
          setPlainLyrics(editedLyricsText);
          setIsSynced(false);
        }
        setIsEditingLyrics(false);
        notify(language === 'es' ? 'Letra guardada correctamente.' : 'Lyrics updated successfully.', 'success');
      } else {
        notify(language === 'es' ? 'Error al guardar la letra.' : 'Error saving corrected lyrics.', 'error');
      }
    } catch (err) {
      console.error(err);
      notify(language === 'es' ? 'Error al guardar la letra.' : 'Error saving corrected lyrics.', 'error');
    }
  };

  const shareTrack = (track: any) => {
    if (!track) return;
    const url = `${window.location.origin}${window.location.pathname}?trackId=${encodeURIComponent(track.id)}&title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}&thumbnail=${encodeURIComponent(track.thumbnail || '')}`;
    
    const fallbackCopy = (text: string) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.style.opacity = "0";
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          notify(t('link_copied'), 'success');
        } else {
          notify('Por favor, copia este enlace: ' + text, 'info');
        }
      } catch (err) {
        document.body.removeChild(textArea);
        console.error('Fallback copy failed:', err);
        notify('No se pudo copiar, enlace: ' + text, 'info');
      }
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        notify(t('link_copied'), 'success');
      }).catch((err) => {
        console.warn('Clipboard API failed, trying fallback:', err);
        fallbackCopy(url);
      });
    } else {
      fallbackCopy(url);
    }
  };

  // Check for shared track in URL query parameters on load
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('trackId') || params.get('track');
    if (trackId) {
      const title = params.get('title') || 'Shared Track';
      const artist = params.get('artist') || 'Unknown Artist';
      const thumbnail = params.get('thumbnail') || '';
      
      const track = {
        id: trackId,
        title,
        artist,
        thumbnail,
      };
      
      playTrack(track);
      
      // Clean up the URL query parameters so page refreshes don't re-trigger it
      try {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (err) {
        console.error('Failed to clear URL parameter:', err);
      }
    }
  }, [playTrack]);

  // Reset lyrics view when track changes, auto-expand player, & start background analysis of lyrics instantly with a 1.5s debounce to save API quota!
  React.useEffect(() => {
    setLyrics('');
    setSyncedLyrics(null);
    setPlainLyrics(null);
    setIsSynced(false);
    setLyricsAlbum(null);
    setIsEditingLyrics(false);
    setEditedLyricsText('');
    
    if (!currentTrack) {
      setIsLoadingLyrics(false);
      return;
    }

    if (activeTabRef.current !== 'feed') {
      setIsExpanded(true);
    }
    
    let active = true;
    const timer = setTimeout(async () => {
      setIsLoadingLyrics(true);
      try {
        const result = await youtubeService.getLyrics(currentTrack.title, currentTrack.artist);
        if (active) {
          if (result) {
            setLyrics(result.lyrics || '');
            setSyncedLyrics(result.syncedLyrics || null);
            setPlainLyrics(result.plainLyrics || null);
            setIsSynced(!!result.isSynced);
            setLyricsAlbum(result.albumName || null);
          }
        }
      } catch (e) {
        if (active) {
          setLyrics('No se encontraron letras disponibles.');
          setSyncedLyrics(null);
          setPlainLyrics('No se encontraron letras disponibles.');
          setIsSynced(false);
          setLyricsAlbum(null);
        }
      } finally {
        if (active) {
          setIsLoadingLyrics(false);
        }
      }
    }, 1500); // 1.5s delay debounces fast skips entirely!

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentTrack?.id]);

  // Collapse player automatically when switching to feed
  React.useEffect(() => {
    if (activeTab === 'feed') {
      setIsExpanded(false);
    }
  }, [activeTab]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayerError = async (code: number) => {
    console.error('Player error code:', code);
    
    // Skip fallback searching for local user-uploaded videos
    if ((currentTrack as any)?.isUserUploaded) {
      console.log('User-uploaded video track, bypassing YouTube error fallback');
      return;
    }
    
    // Classic fallback to ensure robust playback if restricted/failed
    if ([2, 5, 100, 101, 150].includes(code) && currentTrack) {
      failedVideoIdsRef.current.add(currentTrack.id);
      
      if (consecutiveFallbackCountRef.current >= 2) {
        console.warn('Exceeded maximum alternative attempts for failed/restricted songs. Loading next queue track.');
        notify(language === 'es' ? 'Contenido restringido o no disponible. Avanzando...' : 'Content restricted or unavailable. Skipping...', 'info');
        nextTrack();
        return;
      }

      consecutiveFallbackCountRef.current += 1;
      console.warn(`Track ${currentTrack.title} failed with code ${code} (Attempt ${consecutiveFallbackCountRef.current}). Searching for alternative...`);
      
      try {
        const queryTerm = `${currentTrack.title} ${currentTrack.artist} topic`;
        const results = await youtubeService.search(queryTerm);
        // Find alternative video ID that hasn't failed yet
        const alternative = results.find(t => t.id !== currentTrack.id && !failedVideoIdsRef.current.has(t.id));
        if (alternative) {
           // Register this fallback in player context so standard syncing logic is aware!
           registerFallback(currentTrack.id, alternative);
           playTrack(alternative, queue);
           return;
        }
      } catch (e) {
        console.error('Fallback search failed:', e);
      }
      nextTrack();
    } else {
      setTimeout(() => nextTrack(), 1000); 
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen />;
      case 'search': return <SearchScreen />;
      case 'feed': return <TikTokFeedScreen setActiveTab={setActiveTab} />;
      case 'create': return <CreatePostScreen onNavigateBack={() => setActiveTab('feed')} />;
      case 'social': return <SocialScreen />;
      case 'live': return <LiveStreamScreen />;
      case 'chat': return <ChatScreen />;
      case 'stats': return <StatsScreen />;
      case 'library': return <LibraryScreen />;
      case 'profile': return <ProfileScreen />;
      case 'editor': return <VideoEditorScreen onClose={() => setActiveTab('home')} />;
      case 'rooms': return <MusicRoomsScreen onClose={() => setActiveTab('home')} />;
      default: return <HomeScreen />;
    }
  };

  const isLiked = currentTrack ? likedTracks.some(t => t.id === currentTrack.id) : false;

  return (
    <div 
      className="flex h-screen text-onBackground overflow-hidden font-sans select-none relative"
      style={{ 
        backgroundColor: '#050505',
        backgroundImage: `${auraColors[activeAura]?.radial}, radial-gradient(circle at 90% 80%, rgba(0, 203, 255, 0.05) 0%, transparent 60%)`,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Intro Cinematográfico (Transition from deep black to neon aura) */}
      <AnimatePresence>
        {isIntroActive && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0, 
              y: -50,
              filter: 'blur(20px)',
              transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
            }}
            className="fixed inset-0 bg-[#050505] z-[9999] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Pulsing Aura lights */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[110px] animate-pulse" />
            <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-[#00cbff]/10 rounded-full blur-[80px] animate-pulse" />

            <div className="text-center z-10 flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="w-20 h-20 bg-gradient-to-tr from-primary to-[#00cbff] rounded-[24px] flex items-center justify-center p-0.5 shadow-[0_0_50px_rgba(3,221,130,0.4)]"
              >
                <div className="w-full h-full bg-[#050505] rounded-[22px] flex items-center justify-center">
                  <Play size={36} fill="#00df82" className="text-primary ml-1" />
                </div>
              </motion.div>
              <div className="space-y-1">
                <motion.h1 
                  initial={{ tracking: '-0.05em', opacity: 0 }}
                  animate={{ tracking: '-0.02em', opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-4xl font-black bg-gradient-to-r from-primary via-[#00cbff] to-white bg-clip-text text-transparent"
                >
                  VIBESONIC
                </motion.h1>
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-gray-500">
                  {language === 'es' ? 'Sintonizando Multiverso' : 'Calibrating Soundscape'}
                </p>
              </div>
            </div>

            {/* Float details */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[9px] font-mono text-gray-600 uppercase tracking-widest text-center select-none">
              ULTRA PREMIUM SYSTEM v2.4
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional Smartphone Simulator Bezel framing on Desktop */}
      {useDeviceFrame ? (
        <div className="hidden sm:flex flex-1 items-center justify-center p-6 bg-gradient-to-tr from-[#0a0a0f] via-[#040406] to-[#070c12] relative overflow-hidden select-none w-screen h-screen">
          {/* Neon atmospheric glow */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

          {/* Left info panel panel */}
          <div className="hidden lg:block max-w-sm mr-12 z-20 space-y-6">
            <span className="text-[10px] font-mono font-black text-primary uppercase tracking-[0.25em] bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full shadow-lg shadow-primary/5 inline-flex items-center gap-1.5">
              <Sparkles size={11} className="animate-spin" /> {language === 'es' ? 'VIBESONIC NATIVO ANDROID' : 'VIBESONIC ANDROID PREVIEW'}
            </span>
            <div className="space-y-3">
              <h1 className="text-5xl font-black bg-gradient-to-r from-primary via-[#00cbff] to-white bg-clip-text text-transparent tracking-tighter">
                VIBESONIC
              </h1>
              <p className="text-gray-400 text-xs leading-relaxed font-semibold">
                {language === 'es' 
                  ? 'Hemos diseñado la aplicación con una arquitectura móvil adaptada a las pautas de Play Store. Disfruta de la experiencia real deslizando los feeds, activando rachas y simulando salas live en este dispositivo interactivo virtual.' 
                  : 'We engineered the app as a true native-first client optimized for high perf Android devices. Swivel on the custom mock chassis to try the synced lyrics, voice-chat indicators, and streak triggers right now!'}
              </p>
            </div>

            {/* Quick specifications badges */}
            <div className="grid grid-cols-2 gap-3 pb-2 text-[10px] text-gray-500 font-mono font-bold uppercase">
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl flex items-center gap-2">
                <Flame size={14} className="text-[#00df82]" />
                <span>Rachas 🔥 Fuego</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl flex items-center gap-2">
                <Video size={14} className="text-pink-400" />
                <span>Lives 🔴 Sim</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl flex items-center gap-2">
                <Sparkles size={14} className="text-yellow-400" />
                <span>LRC ⚡ Synced</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl flex items-center gap-2">
                <MessageSquare size={14} className="text-cyan-400" />
                <span>Inbox 💬 DMs</span>
              </div>
            </div>

            <div className="flex gap-4 items-center pt-2">
              <button 
                onClick={() => setUseDeviceFrame(false)}
                className="bg-white text-black text-[11px] font-black uppercase tracking-wider px-6 py-3.5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 cursor-pointer flex items-center gap-2"
              >
                <Smartphone size={14} />
                <span>{language === 'es' ? 'Pantalla Completa' : 'Full Screen Width'}</span>
              </button>

              <button 
                onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                className="bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase tracking-wider px-5 py-3.5 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Languages size={14} />
                <span>{language === 'es' ? 'English (ENG)' : 'Español (ESP)'}</span>
              </button>
            </div>
            
            <p className="text-[9px] text-gray-600 font-mono font-semibold">
              PREVIEW SYSTEM v2.4 • DISPOSITIVO VIRTUAL MOCKUP
            </p>
          </div>

          {/* Physical Phone Shell markup with virtual notch */}
          <div className="relative w-[385px] h-[785px] rounded-[52px] bg-[#12141c] border-[7px] border-[#363a45] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex-shrink-0 z-20 outline outline-[3px] outline-black ring-1 ring-white/15 overflow-hidden flex flex-col">
            
            {/* Camera speaker bezel Notch cutout bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-black rounded-b-2xl z-[110] flex items-center justify-center">
              {/* Speaker pill */}
              <div className="w-12 h-1 bg-[#1a1a1a] rounded-full absolute top-[6px]" />
              {/* Camera circular lens */}
              <div className="w-3 h-3 bg-[#080c10] border border-blue-900 rounded-full absolute right-6 top-[8px]" />
            </div>

            {/* Simulated Live Android OS StatusBar */}
            <div className="absolute top-0 left-0 right-0 h-9 z-[100] px-6 text-white text-[10px] font-bold font-mono tracking-wide flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent pointer-events-none">
              <span className="text-[11px] pt-1.5 select-none text-white font-black">12:44</span>
              <div className="flex items-center gap-1.5 pt-1.5 select-none text-white font-bold text-[9px]">
                <span className="text-[7.5px] bg-[#00df82]/20 border border-[#00df82]/40 px-1 py-0.2 rounded text-[#00df82] uppercase font-black tracking-tight scale-90">5G LTE</span>
                <span>📶</span>
                <span>🔋 98%</span>
              </div>
            </div>

            {/* Actual screen view inside the Bezel Frame */}
            <div className="flex-1 w-full bg-black relative overflow-hidden flex flex-col">
              {/* Nested Client App Content */}
              <div className="h-full w-full flex flex-col relative overflow-hidden bg-black select-none text-white">
                <div className="flex-1 overflow-hidden relative flex flex-col">
                  
                  {/* Notifications inside phone mock */}
                  <AnimatePresence>
                    {notification && (
                      <motion.div 
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="absolute top-11 left-4 right-4 z-[100] bg-primary text-black px-4 py-2.5 rounded-2xl font-black text-[10px] shadow-2xl flex items-center gap-2 border border-primary/20"
                      >
                        <Music2 size={13} className="text-black" />
                        <span className="truncate flex-1 leading-tight">{notification.message}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Header bar within the phone mock */}
                  {activeTab !== 'feed' && activeTab !== 'create' && activeTab !== 'editor' && (
                    <header className="p-4 pt-11 flex items-center justify-between z-20 absolute top-0 left-0 right-0 bg-transparent">
                      <div className="flex items-center gap-2">
                         {currentTrack?.thumbnail ? (
                           <motion.div 
                             animate={{ rotate: isPlaying ? 360 : 0 }}
                             transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                             className="w-7 h-7 rounded-full overflow-hidden shadow-lg border border-primary/40 flex-shrink-0 cursor-pointer ring-2 ring-primary/25"
                             onClick={() => setIsExpanded(true)}
                           >
                             <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                           </motion.div>
                         ) : (
                           <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/40 animate-pulse" />
                           </div>
                         )}
                         <span onClick={() => currentTrack && setIsExpanded(true)} className="font-black text-xl bg-gradient-to-r from-primary via-[#00eae6] to-[#00abff] bg-clip-text text-transparent tracking-tighter cursor-pointer">VibeSonic</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                          className="bg-black/40 border border-white/5 hover:bg-black/60 rounded-full px-2.5 py-1 text-[9px] font-black text-white focus:outline-none flex items-center gap-1.5 cursor-pointer"
                        >
                          <Languages size={10} />
                          <span>{language === 'es' ? 'ESP' : 'ENG'}</span>
                        </button>
                      </div>
                    </header>
                  )}

                  {/* Principal Screen Container inside phone */}
                  <main className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide select-none bg-black ${
                    activeTab === 'feed'
                      ? 'p-0 w-full h-full pt-0 absolute inset-0'
                      : `pt-[calc(3.5rem+env(safe-area-inset-top))] px-4 ${currentTrack ? 'pb-36' : 'pb-[calc(5.5rem+env(safe-area-inset-bottom))]'}`
                  }`}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="h-full"
                      >
                        {useDeviceFrame && isDesktop ? renderScreen() : null}
                      </motion.div>
                    </AnimatePresence>
                  </main>

                  {/* Phone Mini Player inside frame */}
                  {!isExpanded && currentTrack && activeTab !== 'feed' && activeTab !== 'create' && activeTab !== 'editor' && (
                    <div className="absolute bottom-[4.75rem] left-2.5 right-2.5 z-[90]">
                      <AnimatePresence>
                        <motion.div 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="bg-[#12141d]/95 backdrop-blur-3xl rounded-2xl p-2.5 flex items-center justify-between shadow-2xl border border-white/10 cursor-pointer"
                          onClick={() => setIsExpanded(true)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-primary/10 shadow-inner flex-shrink-0">
                              <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-black truncate leading-tight text-white">{currentTrack.title}</p>
                              <p className="text-[9px] text-[#00df82] truncate uppercase font-bold tracking-tight mt-0.5">{currentTrack.artist}</p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-primary pr-1 ml-2 cursor-pointer hover:bg-white/5"
                          >
                            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                          </button>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Custom simulated Android Navigation bar inside phone */}
                  <nav className={`absolute bottom-0 left-0 right-0 h-14 flex items-center justify-around px-2 z-[90] shadow-3xl transition-all duration-300 ${
                    activeTab === 'feed'
                      ? 'bg-black/35 backdrop-blur-lg border-t border-white/10'
                      : 'bg-[#07080b]/95 backdrop-blur-3xl border-t border-white/5'
                  }`}>
                    <NavButton 
                      active={activeTab === 'home'} 
                      onClick={() => setActiveTab('home')} 
                      icon={<Home size={18} />} 
                      label={t('home')} 
                    />
                    <NavButton 
                      active={activeTab === 'feed'} 
                      onClick={() => setActiveTab('feed')} 
                      icon={<PlayCircle size={18} />} 
                      label="Feed" 
                    />
                    <NavButton 
                      active={activeTab === 'social'} 
                      onClick={() => setActiveTab('social')} 
                      icon={<Heart size={18} />} 
                      label="Social" 
                    />
                    <NavButton 
                      active={activeTab === 'live'} 
                      onClick={() => setActiveTab('live')} 
                      icon={<Video size={18} />} 
                      label="Live" 
                    />
                    <NavButton 
                      active={['chat', 'stats', 'library'].includes(activeTab)} 
                      onClick={() => setShowMoreMenu(true)} 
                      icon={<Menu size={18} className="text-primary animate-pulse" />} 
                      label="More" 
                    />
                  </nav>

                </div>
              </div>
            </div>

            {/* Hardware virtual Android home pill overlay */}
            <div className="absolute bottom-1 bg-white/40 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full z-[110]" />
          </div>
        </div>
      ) : null}

      {/* Floating Aura Particles */}
      <div className={`fixed inset-0 pointer-events-none overflow-hidden z-10 ${useDeviceFrame ? 'sm:hidden' : ''}`}>
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bg-white rounded-full opacity-0"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              bottom: '-5%',
              boxShadow: `0 0 8px #fff`,
              animation: `particlesRise ${p.animDuration}s linear infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-80 bg-surface m-2 rounded-xl border border-outline/30 overflow-hidden shadow-2xl flex-shrink-0 ${useDeviceFrame ? 'sm:hidden' : ''}`}>
        <div className="pt-6 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
               <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/40 animate-pulse" />
            </div>
            <span className="font-black text-2xl bg-gradient-to-r from-primary via-[#00eae6] to-[#00abff] bg-clip-text text-transparent tracking-tighter">VibeSonic</span>
          </div>
          <button 
            onClick={() => setUseDeviceFrame(!useDeviceFrame)}
            className={`p-2 rounded-lg border transition-all cursor-pointer hidden sm:block ${useDeviceFrame ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(3,221,130,0.2)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
            title="Toggle Smartphone Mockup Frame"
          >
            <Smartphone size={16} />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[360px] scrollbar-hide border-b border-white/5">
          <SidebarNavButton 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
            icon={<Home size={19} />} 
            label={language === 'es' ? 'Inicio 🎵' : 'Home 🎵'} 
          />
          <SidebarNavButton 
            active={activeTab === 'search'} 
            onClick={() => setActiveTab('search')} 
            icon={<Search size={19} />} 
            label={language === 'es' ? 'Buscar 🔍' : 'Search 🔍'} 
          />
          <SidebarNavButton 
            active={activeTab === 'feed'} 
            onClick={() => setActiveTab('feed')} 
            icon={<PlayCircle size={19} />} 
            label={language === 'es' ? 'Vibe Reels 🔥' : 'Vibe Feed 🔥'} 
          />
          <SidebarNavButton 
            active={activeTab === 'create'} 
            onClick={() => setActiveTab('create')} 
            icon={<PlusSquare size={19} className="text-primary animate-pulse" />} 
            label={language === 'es' ? 'Crear 🚀' : 'Create 🚀'} 
          />
          <SidebarNavButton 
            active={activeTab === 'social'} 
            onClick={() => setActiveTab('social')} 
            icon={<Heart size={19} />} 
            label={language === 'es' ? 'Social 📸' : 'Social 📸'} 
          />
          <SidebarNavButton 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            icon={<MessageSquare size={19} />} 
            label={language === 'es' ? 'Chats 💬' : 'Chats 💬'} 
          />
          <SidebarNavButton 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
            icon={<TrendingUp size={19} />} 
            label={language === 'es' ? 'Mi Vibra 📈' : 'My Vibe 📈'} 
          />
          <SidebarNavButton 
            active={activeTab === 'library'} 
            onClick={() => setActiveTab('library')} 
            icon={<Library size={19} />} 
            label={language === 'es' ? 'Biblioteca 📚' : 'Library 📚'} 
          />
          <SidebarNavButton 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
            icon={<User size={19} />} 
            label={language === 'es' ? 'Perfil 👤' : 'Profile 👤'} 
          />
        </nav>

        <div className="flex-1 overflow-hidden flex flex-col px-6">
           <header className="flex items-center justify-between mb-4 mt-2">
              <div className="flex items-center gap-3 text-gray-400">
                 <Library size={24} />
                 <span className="font-bold">{t('library')}</span>
              </div>
           </header>
           
            <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide py-2">
               {/* Liked Songs Entry */}
               {likedTracks.length > 0 && (
                 <div 
                   onClick={() => setActiveTab('library')}
                   className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                 >
                   <div className="w-12 h-12 rounded-md bg-gradient-to-br from-indigo-700 to-blue-300 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Heart size={24} fill="white" className="text-white" />
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-white">{t('liked_songs')}</p>
                      <p className="text-xs text-gray-400">{t('playlist')} • {likedTracks.length} {t('songs')}</p>
                   </div>
                 </div>
               )}

               {/* Followed Artists as Albums */}
               {followedArtists.map(artist => (
                 <div 
                   key={artist.name} 
                   onClick={() => {
                     setActiveTab('library');
                     // Note: We could add logic to auto-scroll to this artist
                   }}
                   className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                 >
                   <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-lg ring-1 ring-white/10">
                      <img src={artist.thumbnail} alt="" className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold truncate text-white">{artist.name}</p>
                      <p className="text-xs text-gray-400">{t('artist_album')}</p>
                   </div>
                 </div>
               ))}

               {likedTracks.length === 0 && followedArtists.length === 0 && (
                 <div className="p-4 rounded-xl bg-surfaceVariant/60 border border-outline/30 space-y-4">
                    <p className="font-bold text-sm">{t('create_playlist')}</p>
                    <p className="text-xs text-gray-400">{t('easy_help')}</p>
                    <button className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:scale-105 transition-transform" onClick={() => setActiveTab('search')}>
                       {t('browse_tracks')}
                    </button>
                 </div>
               )}
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 bg-surface md:m-2 md:ml-0 rounded-xl border border-outline/30 overflow-hidden relative group/content shadow-2xl ${useDeviceFrame ? 'sm:hidden' : ''}`}>
        {/* Dynamic Background Gradient */}
        {currentTrack && (
          <div 
            className="absolute inset-0 z-0 transition-opacity duration-1000 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 0%, #00df8244 0%, transparent 75%)`
            }}
          />
        )}
        
        {/* Notifications */}
        <AnimatePresence>
          {notification && (
              <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-primary text-black px-6 py-3 rounded-full font-black shadow-2xl flex items-center gap-3"
              >
                <Music2 size={20} />
                {notification.message}
              </motion.div>
          )}
        </AnimatePresence>

        {activeTab !== 'feed' && activeTab !== 'create' && activeTab !== 'editor' && (
          <header className="p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between z-20 absolute top-0 left-0 right-0 bg-gradient-to-b from-background/80 to-transparent">
            <div className="flex items-center gap-2.5 md:hidden">
               {currentTrack?.thumbnail ? (
                 <motion.div 
                   animate={{ rotate: isPlaying ? 360 : 0 }}
                   transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                   className="w-7 h-7 rounded-full overflow-hidden shadow-lg border border-primary/40 flex-shrink-0 cursor-pointer ring-2 ring-primary/25"
                   onClick={() => setIsExpanded(true)}
                 >
                   <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 </motion.div>
               ) : (
                 <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/40 animate-pulse" />
                 </div>
               )}
               <span onClick={() => currentTrack && setIsExpanded(true)} className="font-black text-xl bg-gradient-to-r from-primary via-[#00eae6] to-[#00abff] bg-clip-text text-transparent tracking-tighter cursor-pointer">VibeSonic</span>
               
  
            </div>
  
            <div className="flex items-center gap-3 ml-auto">
               <div className="hidden sm:flex items-center bg-black/20 rounded-full p-1 ring-1 ring-white/10 mr-2">
                  <button 
                    onClick={() => setLanguage('es')}
                    className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${language === 'es' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    ESP
                  </button>
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${language === 'en' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    ENG
                  </button>
               </div>
               {!user ? (
                <button 
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-white text-black text-sm font-black px-6 py-2 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  {t('log_in')}
                </button>
              ) : (
                <button 
                  onClick={logout}
                  className="flex items-center gap-2 bg-black/40 hover:bg-black/60 transition-colors rounded-full p-1 pr-3 border border-white/10"
                >
                  <div className="w-7 h-7 rounded-full bg-[#333333] flex items-center justify-center overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <span className="text-xs font-bold text-white truncate max-w-[100px]">
                    {user.displayName || 'User'}
                  </span>
                </button>
              )}
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={`flex-1 transition-all ${
          activeTab === 'feed'
            ? 'p-0 w-full h-full pt-0 absolute inset-0 overflow-hidden z-20'
            : `overflow-y-auto overflow-x-hidden pt-[calc(5.25rem+env(safe-area-inset-top))] px-4 md:px-6 scrollbar-hide ${currentTrack ? 'pb-[calc(11.5rem+env(safe-area-inset-bottom))]' : 'pb-[calc(6.5rem+env(safe-area-inset-bottom))]'}`
        }`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {!useDeviceFrame || !isDesktop ? renderScreen() : null}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mini Player (Mobile Only) */}
        {!isExpanded && currentTrack && activeTab !== 'feed' && activeTab !== 'create' && activeTab !== 'editor' && (
          <div className="md:hidden">
            <AnimatePresence>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-2.5 right-2.5 bg-surfaceVariant/95 backdrop-blur-3xl rounded-2xl p-2.5 flex items-center gap-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.7)] z-50 border border-white/10"
                onClick={() => setIsExpanded(true)}
              >
                <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden bg-primary/10 shadow-inner">
                  {currentTrack?.thumbnail ? (
                    <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music2 size={22} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold truncate leading-tight text-white animate-fade-in">
                    {currentTrack?.title || "Welcome"}
                  </p>
                  <p className="text-[11px] text-onSurfaceVariant truncate uppercase tracking-tight">
                    {currentTrack?.artist || t('tap_to_play')}
                  </p>
                </div>
                <div className="flex items-center gap-2 pr-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-primary"
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

      <YouTubePlayer 
        videoId={currentTrack?.id} 
        isPlaying={isPlaying} 
        volume={volume} 
        onTrackEnd={nextTrack}
        onError={handlePlayerError}
        isHidden={activeTab === 'feed'}
      />
    </div>

      {/* Desktop Bottom Player */}
      <AnimatePresence>
        {currentTrack && activeTab !== 'feed' && activeTab !== 'create' && activeTab !== 'editor' && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="hidden md:block fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-outline/50 h-24 px-4 z-[60]"
          >
            <div className="flex items-center justify-between h-full max-w-[100vw]">
              {/* Left: Info */}
              <div 
                className="flex items-center gap-4 w-[30%] min-w-[200px] cursor-pointer"
                onClick={() => setIsExpanded(true)}
              >
                <div className="w-14 h-14 rounded overflow-hidden shadow-lg flex-shrink-0 group relative">
                  <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ChevronDown className="rotate-180 transform" size={24} />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-sm truncate hover:underline">{currentTrack.title}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-400 truncate hover:underline">{currentTrack.artist}</p>
                    {(() => {
                      const isFollowing = followedArtists.some(a => a.name === currentTrack.artist);
                      return (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollowArtist({
                              id: '',
                              name: currentTrack.artist,
                              thumbnail: currentTrack.thumbnail
                            });
                          }}
                          className={`flex items-center gap-1 text-[10px] uppercase font-black transition-colors ${isFollowing ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                          title={isFollowing ? 'Unfollow' : 'Follow'}
                        >
                          {isFollowing ? <UserCheck size={12} /> : <UserPlus size={12} />}
                        </button>
                      );
                    })()}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleLike(currentTrack); }} className={`transition-colors ${isLiked ? 'text-primary' : 'text-gray-400 hover:text-white'}`}>
                  <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                </button>
              </div>

          {/* Center: Controls */}
          <div className="flex flex-col items-center gap-2 max-w-[40%] w-full">
            <div className="flex items-center gap-6">
              <button 
                onClick={toggleShuffle} 
                className={`transition-colors ${isShuffle ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                title="Shuffle"
              >
                <Shuffle size={18} />
              </button>
              <button 
                onClick={prevTrack} 
                className="text-gray-400 hover:text-white transition-colors"
                title="Previous"
              >
                <SkipBack size={24} fill="currentColor" />
              </button>
              <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>
              <button 
                onClick={nextTrack} 
                className="text-gray-400 hover:text-white transition-colors"
                title="Next"
              >
                <SkipForward size={24} fill="currentColor" />
              </button>
              <button 
                onClick={toggleRepeat} 
                className={`transition-colors ${repeatMode !== 'none' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                title={repeatMode === 'one' ? 'Repeat One' : 'Repeat All'}
              >
                {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full flex items-center gap-2 group">
              <span className="text-[10px] text-gray-500 w-10 text-right">{formatTime(currentTime)}</span>
              <div className="flex-1 relative h-1 flex items-center">
                <input 
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="1"
                  value={currentTime || 0}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white group-hover:bg-primary transition-colors" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                {/* Visual Handle */}
                <div 
                  className="absolute w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg pointer-events-none"
                  style={{ left: `calc(${progress}% - 6px)` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Extra Controls */}
          <div className="flex items-center justify-end gap-4 w-[30%] min-w-[200px]">
            <button className="text-gray-400 hover:text-white transition-colors">
              <ListMusic size={18} />
            </button>
            <div className="flex items-center gap-2 w-32 group">
              <button onClick={() => setVolume(volume === 0 ? 0.5 : 0)} className="text-gray-400 hover:text-white transition-colors">
                {volume === 0 ? <VolumeX size={18} /> : volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />}
              </button>
              <div className="flex-1 relative h-1 flex items-center">
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white group-hover:bg-primary transition-colors" 
                    style={{ width: `${volume * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

      {/* Bottom Nav (Mobile Only) */}
      <nav className="md:hidden bg-surface/95 backdrop-blur-3xl border-t border-outline/30 h-[calc(3.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] flex items-center justify-around px-1 z-40 fixed bottom-0 left-0 right-0 shadow-[0_-10px_35px_rgba(0,0,0,0.8)]">
        <NavButton 
          active={activeTab === 'home'} 
          onClick={() => setActiveTab('home')} 
          icon={<Home size={18} />} 
          label={language === 'es' ? 'Inicio' : 'Home'} 
        />
        <NavButton 
          active={activeTab === 'feed'} 
          onClick={() => setActiveTab('feed')} 
          icon={<PlayCircle size={18} />} 
          label="Feed" 
        />
        <NavButton 
          active={activeTab === 'create'} 
          onClick={() => setActiveTab('create')} 
          icon={<PlusSquare size={18} className="text-primary animate-pulse" />} 
          label={language === 'es' ? 'Crear' : 'Create'} 
        />
        <NavButton 
          active={activeTab === 'search'} 
          onClick={() => setActiveTab('search')} 
          icon={<Search size={18} />} 
          label={language === 'es' ? 'Buscar' : 'Search'} 
        />
        <NavButton 
          active={activeTab === 'chat'} 
          onClick={() => setActiveTab('chat')} 
          icon={<MessageSquare size={18} />} 
          label="Chats" 
        />
        <NavButton 
          active={['social', 'stats', 'library', 'profile'].includes(activeTab)} 
          onClick={() => setShowMoreMenu(true)} 
          icon={<Menu size={18} className="text-primary" />} 
          label={language === 'es' ? 'Más' : 'More'} 
        />
      </nav>

      {/* Expanded Player (Full Screen Overlay) */}
      <AnimatePresence>
        {isExpanded && currentTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col overflow-hidden h-[100dvh]"
          >
            {/* Ambient Background Effect */}
            <div 
              className="absolute inset-0 transition-all duration-[1200ms] ease-out-back"
              style={{
                background: showLyrics 
                  ? getTrackGradient(currentTrack) 
                  : 'radial-gradient(circle at 50% 50%, #0c0c0e 0%, #000000 100%)'
              }}
            >
              {!showLyrics && (
                <div 
                  className="absolute inset-0 opacity-40 blur-[120px] scale-150 transition-all duration-[2200ms]"
                  style={{
                    background: `url(${currentTrack.thumbnail}) center/cover no-repeat`
                  }}
                />
              )}
              {/* Soft atmospheric noise grid and breathing overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/35 to-black pointer-events-none" />
            </div>
             <div className="relative z-10 flex flex-col h-[100dvh] justify-between p-4 xs:p-5 md:py-6 md:px-12 lg:p-12 max-w-7xl mx-auto w-full overflow-hidden select-none pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(1.75rem+env(safe-area-inset-bottom))]">
              {showLyrics ? (
                /* ----------------- LYRICS MODE (MATCHES SCREENSHOT) ----------------- */
                <>
                  <header className="flex flex-col gap-3 justify-between items-center mb-3 sm:mb-4 flex-shrink-0 w-full animate-fadeIn select-none">
                    <div className="flex items-center justify-between w-full">
                      <button 
                        onClick={() => setShowLyrics(false)}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <ChevronLeft size={22} className="text-white" />
                      </button>
                      
                      {/* Premium Top Center Badge */}
                      <div className="flex items-center gap-3 relative bg-black/45 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-2xl shadow-xl max-w-[70%] sm:max-w-md">
                        <img 
                          src={currentTrack.thumbnail} 
                          className="w-8 h-8 rounded-lg border border-white/10 object-cover flex-shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-left min-w-0">
                          <h3 className="font-extrabold text-white text-[11px] sm:text-xs truncate leading-tight">{currentTrack.title}</h3>
                          <p className="text-primary text-[9.5px] truncate font-bold mt-0.5 leading-none">{currentTrack.artist}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setEditedLyricsText(lyrics || '');
                            setIsEditingLyrics(true);
                          }}
                          className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-gray-450 hover:text-white flex-shrink-0 ml-1"
                          title={language === 'es' ? 'Editar letras' : 'Edit lyrics'}
                        >
                          <MoreHorizontal size={13} />
                        </button>
                      </div>

                      <div className="w-10 h-10 flex-shrink-0" /> {/* Symmetry Spacer */}
                    </div>

                    {/* Capsule Search Bar */}
                    <div className="w-full max-w-lg flex items-center justify-between bg-[#1f2024]/40 backdrop-blur-3xl border border-white/10 rounded-full px-5 py-2.0 hover:border-white/20 transition-all">
                      <input 
                        type="text"
                        placeholder={language === 'es' ? 'Buscar contenido relacionado' : 'Search related content'}
                        value={lyricsSearchQuery}
                        onChange={(e) => setLyricsSearchQuery(e.target.value)}
                        className="bg-transparent border-none text-[12px] text-white placeholder:text-gray-400 focus:outline-none focus:ring-0 w-full font-sans font-medium pr-2"
                      />
                      <div className="flex items-center gap-2">
                        {lyricsSearchQuery && (
                          <button 
                            onClick={() => setLyricsSearchQuery('')} 
                            className="text-[10px] text-gray-400 hover:text-white uppercase font-sans font-bold leading-none"
                          >
                            {language === 'es' ? 'Limpiar' : 'Clear'}
                          </button>
                        )}
                        <div className="h-4.5 w-px bg-white/10" />
                        <Search size={15} className="text-[#a0a3bd] cursor-pointer hover:text-white transition-colors" />
                      </div>
                    </div>
                  </header>

                  {/* PORTADA ARRIBA: Safe Visual Cover Section */}
                  <div className="flex-shrink-0 flex items-center justify-center gap-4 py-2 w-full animate-fadeIn">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl relative overflow-hidden shadow-2xl border border-white/15 flex-shrink-0">
                      <img 
                        src={currentTrack.thumbnail} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00df82] animate-ping" />
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-0 max-w-[220px]">
                      <span className="text-[9px] font-mono font-black text-[#00df82] tracking-widest uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00df82] animate-pulse" />
                        {language === 'es' ? 'EN REPRODUCCIÓN' : 'NOW PLAYING'}
                      </span>
                      <div className="font-extrabold text-white text-sm sm:text-base truncate mt-0.5 leading-tight">{currentTrack.title}</div>
                      <div className="text-gray-400 text-xs truncate font-medium leading-none mt-1">{currentTrack.artist}</div>
                    </div>
                  </div>

                  {/* RECUADRO GIGANTE DE LYRICS EN EL CENTRO (Dedicado Cinema Box con Glassmorphism) */}
                  <div className="flex-1 w-full max-w-2xl mx-auto min-h-0 relative select-none overflow-hidden my-3 md:my-5 rounded-[32px] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.7)]">
                    
                    {/* Glassmorphic frosted layer inside */}
                    <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-3xl" />
                    
                    {/* Atmospheric Dynamic Highlight Radial inside the recuadro */}
                    <div className="absolute inset-x-0 -top-16 h-48 bg-gradient-to-b from-[#00df82]/10 to-transparent blur-3xl rounded-full z-[1] pointer-events-none" />
                    
                    <div className="relative z-10 w-full h-full flex flex-col justify-center">
                      {isLoadingLyrics ? (
                        <div className="flex flex-col items-center gap-4 py-20 m-auto">
                          <div className="w-11 h-11 border-4 border-[#00df82] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,223,130,0.3)]" />
                          <p className="text-[#00df82] font-bold uppercase tracking-widest text-[10px] animate-pulse">{t('summoning_lyrics')}</p>
                        </div>
                      ) : isEditingLyrics ? (
                        /* Editing form perfectly fit inside limits */
                        <div className="w-full h-full p-6 flex flex-col space-y-4 max-h-full overflow-y-auto m-auto">
                          <h3 className="text-xs font-mono font-black uppercase text-[#00df82] tracking-widest text-center">
                            {language === 'es' ? '✏️ Corregir Letra' : '✏️ Correct Lyrics'}
                          </h3>
                          <textarea
                            value={editedLyricsText}
                            onChange={(e) => setEditedLyricsText(e.target.value)}
                            className="w-full flex-1 bg-black/45 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-emerald-400 font-sans resize-none font-medium text-center min-h-[120px]"
                            placeholder={language === 'es' ? "Escribe o pega la letra de la canción aquí..." : "Type or paste the song lyrics here..."}
                          />
                          <div className="flex gap-2 justify-center pt-1 flex-shrink-0">
                            <button
                              onClick={() => setIsEditingLyrics(false)}
                              className="px-5 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-wider hover:bg-white/5 text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                            >
                              {language === 'es' ? 'Cancelar' : 'Cancel'}
                            </button>
                            <button
                              onClick={handleSaveLyrics}
                              className="px-6 py-2 rounded-full bg-[#00df82] text-black text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg"
                            >
                              {language === 'es' ? 'Guardar' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* GIGANTE, ELEGANTE, CENTRADO SCROLLING DEDICATED LYRICS BOX */
                        <div 
                          ref={lyricsContainerRef}
                          className="w-full h-full overflow-y-auto scrollbar-hide py-36 px-6 flex flex-col space-y-12 relative select-none scroll-smooth pointer-events-auto"
                          style={{
                            maskImage: 'linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)'
                          }}
                        >
                          {isSynced && parsedLines.length > 0 ? (
                            parsedLines.map((line, idx) => {
                              const isActive = idx === activeLineIndex;
                              return (
                                <div
                                  key={idx}
                                  data-lyric-idx={idx}
                                  onClick={() => seekTo(line.time)}
                                  style={isActive ? {
                                    color: '#ffffff',
                                    textShadow: '0 0 35px rgba(255, 255, 255, 0.95), 0 0 15px rgba(0, 223, 130, 0.25)'
                                  } : undefined}
                                  className={`w-full text-center cursor-pointer py-1 px-1.5 transition-all duration-[400ms] transform origin-center select-none ${
                                    isActive
                                      ? 'text-[32px] xs:text-[40px] sm:text-[48px] md:text-[56px] font-black opacity-100 scale-102 leading-normal tracking-tight'
                                      : 'text-white/20 text-lg xs:text-2xl sm:text-3xl font-extrabold opacity-30 hover:text-white/60 scale-95 leading-normal filter blur-[0.4px] hover:blur-0'
                                  }`}
                                >
                                  {line.text}
                                </div>
                              );
                            })
                          ) : (
                            <div className="w-full text-center space-y-8 py-10 px-2">
                              {(lyrics || t('no_lyrics')).split('\n').map((line, index) => {
                                const trimmed = line.trim();
                                if (!trimmed) {
                                  return <div key={index} className="h-6" />;
                                }
                                return (
                                  <p 
                                    key={index}
                                    className="text-2xl xs:text-3xl sm:text-4xl md:text-[42px] font-black text-white/50 hover:text-[#00df82] transition-colors cursor-default tracking-tight leading-normal"
                                  >
                                    {trimmed}
                                  </p>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CONTROLES ABAJO: Beautiful safe controls block under the lyrics recuadro */}
                  <div className="w-full bg-[#16171a]/55 backdrop-blur-3xl border border-white/5 rounded-[28px] p-4.5 flex flex-col space-y-3 px-5 max-w-2xl mx-auto flex-shrink-0 select-none animate-fadeIn z-20 shadow-2xl">
                    <div className="w-full space-y-2">
                      <div className="relative group/progress h-3 flex items-center">
                        <input 
                          type="range"
                          min="0"
                          max={duration || 100}
                          step="1"
                          value={currentTime || 0}
                          onChange={(e) => seekTo(parseFloat(e.target.value))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white group-hover/progress:bg-primary transition-colors duration-200" 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                        <div 
                          className="absolute w-3.5 h-3.5 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow-xl transition-opacity pointer-events-none"
                          style={{ left: `calc(${progress}% - 7px)` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-bold text-gray-400 px-1 font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                      <button 
                        onClick={() => toggleLike(currentTrack)}
                        className={`p-2 transition-colors ${isLiked ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                      >
                        <Heart className="w-5.5 h-5.5" fill={isLiked ? "currentColor" : "none"} />
                      </button>
                      
                      <div className="flex items-center gap-6 sm:gap-9">
                        <button onClick={prevTrack} className="p-2 text-white hover:text-primary transition-colors transform active:scale-90">
                          <SkipBack className="w-6.5 h-6.5" fill="currentColor" />
                        </button>
                        <button 
                          onClick={togglePlay}
                          className="w-13 h-13 rounded-full bg-white flex items-center justify-center text-black shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                          {isPlaying ? <Pause className="w-5.5 h-5.5" fill="currentColor" /> : <Play className="w-5.5 h-5.5 ml-0.5" fill="currentColor" />}
                        </button>
                        <button onClick={nextTrack} className="p-2 text-white hover:text-primary transition-colors transform active:scale-90">
                          <SkipForward className="w-6.5 h-6.5" fill="currentColor" />
                        </button>
                      </div>

                      <button 
                        onClick={() => setShowLyrics(false)}
                        className="p-2 rounded-full bg-primary text-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                        title="Show vinyl cover"
                      >
                        <Music2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* ----------------- STANDARD MODE ----------------- */
                <>
                  <header className="flex justify-between items-center mb-2 xs:mb-4 md:mb-6 lg:mb-12 flex-shrink-0">
                    <button 
                      onClick={() => setIsExpanded(false)}
                      className="w-10 h-10 xs:w-12 xs:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <ChevronDown size={24} />
                    </button>
                    <div className="text-center">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-0.5">Playing from</p>
                      <p className="font-bold text-xs xs:text-sm">{t('now_playing')}</p>
                    </div>
                    <button className="w-10 h-10 xs:w-12 xs:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </header>
                  <div className="flex-1 flex flex-col md:flex-row items-center justify-between md:justify-center gap-4 sm:gap-8 md:gap-12 lg:gap-24 overflow-hidden py-3 xs:py-5 sm:py-6 w-full">
                    {/* Album Art Section or Vinyl */}
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key="album-art"
                        layoutId="player-art"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-auto h-[25vh] min-h-[140px] max-h-[240px] xs:h-[28vh] xs:max-h-[295px] md:w-full md:h-auto md:max-w-[330px] lg:max-w-[400px] xl:max-w-[420px] aspect-square flex-shrink-0 relative group flex items-center justify-center mx-auto"
                      >
                        <RotatingVinyl isPlaying={isPlaying} thumbnail={currentTrack.thumbnail} />
                      </motion.div>
                    </AnimatePresence>
       
                    {/* Control Center Section */}
                    <div className="w-full max-w-[450px] flex flex-col justify-between flex-grow flex-1 md:justify-center md:gap-6 lg:gap-8 overflow-hidden md:overflow-visible py-2 xs:py-4">
                      <div className="space-y-1 text-center md:text-left select-none flex-shrink-0">
                        <motion.h1 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="text-lg xs:text-2xl md:text-4xl lg:text-5xl font-black tracking-tight line-clamp-1 md:line-clamp-2"
                        >
                          {currentTrack.title}
                        </motion.h1>
                        <div className="flex flex-col items-center md:items-start select-none">
                          <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-xs xs:text-sm md:text-xl text-primary font-bold truncate max-w-full"
                          >
                            {currentTrack.artist}
                          </motion.p>
                          <button 
                            onClick={() => toggleFollowArtist({
                              id: '',
                              name: currentTrack.artist,
                              thumbnail: currentTrack.thumbnail
                            })}
                            className={`mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] xs:text-[10px] font-bold transition-all ${
                              followedArtists.some(a => a.name === currentTrack.artist)
                                ? 'bg-primary border-primary text-black' 
                                : 'bg-transparent border-white/20 text-white hover:border-white'
                            }`}
                          >
                            {followedArtists.some(a => a.name === currentTrack.artist) ? (
                              <><UserCheck size={11} /> {t('following')}</>
                            ) : (
                              <><UserPlus size={11} /> {t('follow_artist')}</>
                            )}
                          </button>
                        </div>
                      </div>
     
                      {/* Waveform Visualizer */}
                      <div className="w-full h-8 xs:h-11 md:h-12 bg-surface/30 border border-outline/20 rounded-2xl p-1 xs:p-2 backdrop-blur-md flex items-center justify-center relative overflow-hidden flex-shrink-0">
                        <WaveformVisualizer isPlaying={isPlaying} color="#00df82" height={26} />
                      </div>
       
                      {/* Progress Section */}
                      <div className="w-full space-y-1.5 flex-shrink-0">
                        <div className="relative group/progress h-2 flex items-center">
                          <input 
                            type="range"
                            min="0"
                            max={duration || 100}
                            step="1"
                            value={currentTime || 0}
                            onChange={(e) => seekTo(parseFloat(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white group-hover/progress:bg-primary transition-colors" 
                              style={{ width: `${progress}%` }} 
                            />
                          </div>
                          <div 
                            className="absolute w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow-xl transition-opacity pointer-events-none"
                            style={{ left: `calc(${progress}% - 6px)` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] sm:text-[11px] font-bold text-gray-400">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                        {/* Playback Controls Row */}
                      <div className="flex items-center justify-between md:justify-center md:gap-12 flex-shrink-0">
                        <button 
                          onClick={toggleShuffle}
                          className={`p-2 transition-colors ${isShuffle ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                        >
                          <Shuffle className="w-5 h-5 xs:w-6 xs:h-6 md:w-7 md:h-7" />
                        </button>
                        <button onClick={prevTrack} className="p-2 text-white hover:text-primary transition-colors transform active:scale-90">
                          <SkipBack className="w-7 h-7 xs:w-8 xs:h-8 md:w-12 md:h-12" fill="currentColor" />
                        </button>
                        <button 
                          onClick={togglePlay}
                          className="w-12 h-12 xs:w-16 xs:h-16 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center text-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                        >
                          {isPlaying ? <Pause className="w-5 h-5 xs:w-7 xs:h-7 md:w-11 md:h-11" fill="currentColor" /> : <Play className="w-5 h-5 xs:w-7 xs:h-7 md:w-11 md:h-11 ml-0.5 xs:ml-1" fill="currentColor" />}
                        </button>
                        <button onClick={nextTrack} className="p-2 text-white hover:text-primary transition-colors transform active:scale-90">
                          <SkipForward className="w-7 h-7 xs:w-8 xs:h-8 md:w-12 md:h-12" fill="currentColor" />
                        </button>
                        <button 
                          onClick={toggleRepeat}
                          className={`p-2 transition-colors ${repeatMode !== 'none' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                        >
                          {repeatMode === 'one' ? <Repeat1 className="w-5 h-5 xs:w-6 xs:h-6 md:w-7 md:h-7" /> : <Repeat className="w-5 h-5 xs:w-6 xs:h-6 md:w-7 md:h-7" />}
                        </button>
                      </div>
        
                      {/* Action Footer Button Row */}
                      <div className="flex items-center justify-between pt-1.5 xs:pt-2.5 border-t border-white/5 w-full flex-shrink-0">
                        <button 
                           onClick={() => toggleLike(currentTrack)}
                           className={`flex items-center gap-1.5 px-3 py-1.5 xs:py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors ${isLiked ? 'text-primary' : 'text-gray-400'}`}
                         >
                          <Heart className="w-4 h-4 xs:w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
                          <span className="font-bold text-xs text-white">{t('save_liked')}</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => showLyrics ? setShowLyrics(false) : fetchLyrics()}
                            className={`p-2 xs:p-3 rounded-full transition-colors ${showLyrics ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`}
                            title="Lyrics"
                          >
                            <Music2 className="w-4 h-4 xs:w-5 xs:h-5" />
                          </button>
                          <button 
                            onClick={() => shareTrack(currentTrack)}
                            className="p-2 xs:p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                          >
                            <Share2 className="w-4 h-4 xs:w-5 xs:h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Auth Modal Component */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* More Options Drawer Sheet (Mobile Only Drawer) */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Backdrop Blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenu(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] pointer-events-auto"
            />
            
            {/* Drawer Bezel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85%] bg-[#0d0f14] border-t border-white/10 rounded-t-[32px] overflow-hidden z-[120] flex flex-col p-6 space-y-6 pointer-events-auto shadow-3xl text-white pb-[calc(2.5rem+env(safe-area-inset-bottom))]"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto relative -top-2" />
              
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-primary animate-pulse" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#00df82]">
                    {language === 'es' ? 'SISTEMA VIBESONIC MÁS' : 'VIBESONIC OPTIONS'}
                  </h4>
                </div>
                <button 
                  onClick={() => setShowMoreMenu(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Grid of sub tab links */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block leading-none">Navegar Secciones:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => { setActiveTab('social'); setShowMoreMenu(false); }}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      activeTab === 'social' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/35 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Heart size={18} />
                    <span className="text-[9.5px] font-black uppercase tracking-wider">Social</span>
                  </div>

                  <div 
                    onClick={() => { setActiveTab('stats'); setShowMoreMenu(false); }}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      activeTab === 'stats' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/35 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <TrendingUp size={18} />
                    <span className="text-[9.5px] font-black uppercase tracking-wider">Mi Vibra</span>
                  </div>

                  <div 
                    onClick={() => { setActiveTab('library'); setShowMoreMenu(false); }}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      activeTab === 'library' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/35 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Library size={18} />
                    <span className="text-[9.5px] font-black uppercase tracking-wider">{language === 'es' ? 'Colección' : 'Collection'}</span>
                  </div>

                  <div 
                    onClick={() => { setActiveTab('profile'); setShowMoreMenu(false); }}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      activeTab === 'profile' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/35 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <User size={18} />
                    <span className="text-[9.5px] font-black uppercase tracking-wider">{language === 'es' ? 'Mi Perfil' : 'My Profile'}</span>
                  </div>

                  <div 
                    onClick={() => { setActiveTab('editor'); setShowMoreMenu(false); }}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 cursor-pointer transition-all col-span-2 ${
                      activeTab === 'editor' ? 'bg-primary/10 border-primary text-primary' : 'bg-black/35 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Film size={18} />
                    <span className="text-[9.5px] font-black uppercase tracking-wider">Estudio FX</span>
                  </div>
                </div>
              </div>

              {/* Customize Section */}
              <div className="space-y-4 pt-1">
                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block leading-none">Configurar Preferencias:</span>
                
                <div className="space-y-2.5">
                  
                  {/* Smartphone Frame Toggle on Desktop */}
                  <div className="hidden lg:flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <Smartphone size={15} className="text-cyan-400" />
                      <div className="text-left">
                        <p className="text-xs font-black text-white">Bezel Movil Virtual</p>
                        <p className="text-[9.5px] text-gray-500 font-medium">Framing físico de celular Android</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={useDeviceFrame}
                      onChange={(e) => setUseDeviceFrame(e.target.checked)}
                      className="w-4 h-4 accent-primary rounded cursor-pointer"
                    />
                  </div>

                  {/* Language switch */}
                  <div className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <Languages size={15} className="text-[#00df82]" />
                      <div className="text-left">
                        <p className="text-xs font-black text-white">{language === 'es' ? 'Idioma del Sistema' : 'System Language'}</p>
                        <p className="text-[9.5px] text-gray-500 font-medium">{language === 'es' ? 'Cambia la localización regional' : 'Toggle system localization'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                      className="text-[10px] font-mono font-black uppercase text-primary border border-primary/20 bg-primary/10 px-3 py-1.5 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      {language === 'es' ? 'Español (ESP)' : 'English (ENG)'}
                    </button>
                  </div>

                  {/* Aura picker options info shortcut */}
                  <div className="bg-[#10141d]/80 border border-primary/10 p-4 rounded-2xl text-xs space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                    <span className="text-[8.5px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">Holo Aura Customization:</span>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                      {language === 'es' 
                        ? 'Puedes personalizar completamente el gradiente de aura neón cinético de fondo y los colores del visualizador en la pestaña "Mi Vibra" ✨.'
                        : 'You can fully customize the neon aura gradients and wave player styles directly in the "My Vibe" stats panel ✨.'}
                    </p>
                  </div>

                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarNavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full py-1.5 px-3 rounded-xl transition-all ${active ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'}`}
    >
      <div className={`${active ? 'text-primary' : 'text-gray-400 group-hover:text-white'} transition-colors flex-shrink-0`}>
        {icon}
      </div>
      <span className="font-bold text-[13.5px] truncate">{label}</span>
    </button>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 flex-1 py-0.5 transition-all ${active ? 'text-primary' : 'text-onSurfaceVariant/60'}`}
    >
      <div className={`px-2 py-0.5 rounded-xl transition-all duration-300 ${active ? 'bg-primary/15' : 'hover:bg-surfaceVariant/50'}`}>
        {icon}
      </div>
      <span className={`text-[8px] font-black tracking-wider uppercase transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>
        {label}
      </span>
    </button>
  );
}
