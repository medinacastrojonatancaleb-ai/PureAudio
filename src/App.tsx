import React, { useState } from 'react';
import { 
  Home, Search, Library, PlayCircle, PauseCircle, Music2, Heart, History, User,
  ChevronDown, MoreHorizontal, SkipBack, SkipForward, Play, Pause, Volume2, Share2,
  Shuffle, Repeat, Repeat1, ListMusic, Volume1, VolumeX, UserPlus, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import LibraryScreen from './screens/LibraryScreen';
import { usePlayer } from './context/PlayerContext';
import YouTubePlayer from './components/YouTubePlayer';
import { youtubeService } from './services/youtubeService';
import AuthModal from './components/AuthModal';
import { WaveformVisualizer, RotatingVinyl } from './components/AestheticEnhancements';
import { aiHealerService } from './services/AiHealerService';
import AiHealerCockpit from './components/AiHealerCockpit';
import { ShieldAlert, Cpu, Sparkles } from 'lucide-react';

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string>('');
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

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
    setAuthModalOpen
  } = usePlayer();

  const [isHealerCockpitOpen, setIsHealerCockpitOpen] = useState(false);

  const fetchLyrics = async () => {
    if (!currentTrack) return;
    setIsLoadingLyrics(true);
    setShowLyrics(true);
    try {
      const result = await youtubeService.getLyrics(currentTrack.title, currentTrack.artist);
      setLyrics(result);
    } catch (e) {
      setLyrics('Failed to load lyrics.');
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  const copyShareLink = () => {
    if (!currentTrack) return;
    const url = `https://www.youtube.com/watch?v=${currentTrack.id}`;
    navigator.clipboard.writeText(url).then(() => {
      notify(t('link_copied'), 'info');
    });
  };

  // Reset lyrics view when track changes & Auto-expand player
  React.useEffect(() => {
    setShowLyrics(false);
    setLyrics('');
    if (currentTrack) {
      setIsExpanded(true);
    }
  }, [currentTrack?.id]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayerError = async (code: number) => {
    console.error('Player error code:', code);
    
    // Deploy AI Sentinel healing response
    const errorDetails = `YouTube playback returned status code ${code} for track "${currentTrack?.title || 'Unknown'}" by ${currentTrack?.artist || 'Unknown'}`;
    const wasHealed = await aiHealerService.healActivePlayback(
      {
        currentTrack,
        playTrack: (track) => playTrack(track, queue),
        nextTrack,
        notify: (msg, type) => notify(msg, type)
      },
      errorDetails
    );

    if (wasHealed) {
      console.log('[AI Sentinel] Automatic playback anomaly self-healing process complete.');
      return;
    }

    // Classic fallback if healer wasn't active
    if ([101, 150].includes(code) && currentTrack) {
      console.warn(`Track ${currentTrack.title} is restricted. Searching for alternative...`);
      try {
        const results = await youtubeService.search(`${currentTrack.title} ${currentTrack.artist} topic`);
        const alternative = results.find(t => t.id !== currentTrack.id);
        if (alternative) {
           playTrack(alternative, queue);
           return;
        }
      } catch (e) {
        console.error('Fallback search failed:', e);
      }
      nextTrack();
    } else if ([2, 5, 100].includes(code)) {
      setTimeout(() => nextTrack(), 1000); 
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen />;
      case 'search': return <SearchScreen />;
      case 'library': return <LibraryScreen />;
      default: return <HomeScreen />;
    }
  };

  const isLiked = currentTrack ? likedTracks.some(t => t.id === currentTrack.id) : false;

  return (
    <div className="flex h-screen bg-background text-onBackground overflow-hidden font-sans select-none">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-80 bg-surface m-2 rounded-xl border border-outline/30 overflow-hidden shadow-2xl flex-shrink-0">
        <div className="pt-6 px-6 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
             <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/40 animate-pulse" />
          </div>
          <span className="font-black text-2xl bg-gradient-to-r from-primary via-[#00eae6] to-[#00abff] bg-clip-text text-transparent tracking-tighter">VibeSonic</span>
        </div>

        <nav className="p-6 space-y-4">
          <SidebarNavButton 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
            icon={<Home size={28} />} 
            label={t('home')} 
          />
          <SidebarNavButton 
            active={activeTab === 'search'} 
            onClick={() => setActiveTab('search')} 
            icon={<Search size={28} />} 
            label={t('search')} 
          />
        </nav>

        {/* AI Sentinel Controller Console Option */}
        <div className="px-6 pb-2">
          <button
            onClick={() => setIsHealerCockpitOpen(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary animate-pulse flex-shrink-0">
                <Cpu size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-white hover:text-primary transition-colors tracking-tight">Sentinel AI</p>
                <p className="text-[10px] text-gray-400 font-medium font-sans">Automated Self-Healer</p>
              </div>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          </button>
        </div>

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
      <div className="flex-1 flex flex-col min-w-0 bg-surface md:m-2 md:ml-0 rounded-xl border border-outline/30 overflow-hidden relative group/content shadow-2xl">
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

        <header className="p-4 flex items-center justify-between z-20 absolute top-0 left-0 right-0 bg-gradient-to-b from-background/70 to-transparent">
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
             
             {/* Dynamic Sentinel AI operating node on cellular */}
             <button
               onClick={() => setIsHealerCockpitOpen(true)}
               className="p-1 px-2 rounded-full bg-primary/10 border border-primary/20 text-primary animate-pulse flex items-center gap-1 text-[9px] font-black uppercase font-mono tracking-tight"
               title="AI Code Sentinel Status"
             >
               <Cpu size={11} className="animate-spin" style={{ animationDuration: '6s' }} />
               <span>IA Sentinel</span>
             </button>
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-20 px-4 md:px-6 pb-32 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mini Player (Mobile Only) */}
        {!isExpanded && currentTrack && (
          <div className="md:hidden">
            <AnimatePresence>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-24 left-2 right-2 bg-surfaceVariant/95 backdrop-blur-md rounded-xl p-2 flex items-center gap-3 shadow-2xl z-50 border border-outline/40"
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
      />
    </div>

      {/* Desktop Bottom Player */}
      <AnimatePresence>
        {currentTrack && (
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
      <nav className="md:hidden bg-surface/90 backdrop-blur-2xl border-t border-outline/30 h-20 flex items-center justify-around px-4 z-40 fixed bottom-0 left-0 right-0">
        <NavButton 
          active={activeTab === 'home'} 
          onClick={() => setActiveTab('home')} 
          icon={<Home size={22} />} 
          label={t('home')} 
        />
        <NavButton 
          active={activeTab === 'search'} 
          onClick={() => setActiveTab('search')} 
          icon={<Search size={22} />} 
          label={t('search')} 
        />
        <NavButton 
          active={activeTab === 'library'} 
          onClick={() => setActiveTab('library')} 
          icon={<Library size={22} />} 
          label={t('library')} 
        />
      </nav>

      {/* Expanded Player (Full Screen Overlay) */}
      <AnimatePresence>
        {isExpanded && currentTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
          >
            {/* Ambient Background Effect */}
            <div className="absolute inset-0 bg-black">
              <div 
                className="absolute inset-0 opacity-40 blur-[100px] scale-150 transition-all duration-[2000ms]"
                style={{
                  background: `url(${currentTrack.thumbnail}) center/cover no-repeat`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
            </div>
            <div className="relative z-10 flex flex-col h-screen md:h-full justify-between p-4 xs:p-6 md:py-6 md:px-12 lg:p-12 max-w-7xl mx-auto w-full overflow-hidden select-none">
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
                {/* Album Art Section or Lyrics */}
                <AnimatePresence mode="wait">
                  {!showLyrics ? (
                    <motion.div 
                      key="album-art"
                      layoutId="player-art"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="w-full max-w-[245px] xs:max-w-[295px] sm:max-w-[340px] md:max-w-[330px] lg:max-w-[400px] xl:max-w-[420px] aspect-square flex-shrink-0 relative group flex items-center justify-center mx-auto"
                    >
                      <RotatingVinyl isPlaying={isPlaying} thumbnail={currentTrack.thumbnail} />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="lyrics"
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="w-full max-w-2xl h-[300px] md:h-full overflow-y-auto scrollbar-hide py-4 flex flex-col items-center"
                    >
                      {isLoadingLyrics ? (
                        <div className="flex flex-col items-center gap-4 mt-10">
                          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                           <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('summoning_lyrics')}</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                           <p className="text-xl md:text-3xl font-black text-white/90 leading-relaxed whitespace-pre-wrap">
                             {lyrics || t('no_lyrics')}
                           </p>
                           <p className="text-[10px] text-gray-500 italic pb-10">{t('lyrics_by')}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
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
                        onClick={() => {
                          const url = `https://www.youtube.com/watch?v=${currentTrack.id}`;
                          navigator.clipboard.writeText(url);
                          notify(t('link_copied'), 'info');
                        }}
                        className="p-2 xs:p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                      >
                        <Share2 className="w-4 h-4 xs:w-5 xs:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Auth Modal Component */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Invisible AI Active Code Sentinel dashboard */}
      <AiHealerCockpit isOpen={isHealerCockpitOpen} onClose={() => setIsHealerCockpitOpen(false)} />
    </div>
  );
}

function SidebarNavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-5 w-full py-2 group transition-all ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`}
    >
      <div className={`${active ? 'text-primary' : 'text-gray-400 group-hover:text-white'} transition-colors`}>
        {icon}
      </div>
      <span className="font-bold text-lg">{label}</span>
    </button>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 flex-1 py-1 transition-all ${active ? 'text-primary' : 'text-onSurfaceVariant/60'}`}
    >
      <div className={`px-6 py-1.5 rounded-2xl transition-all duration-300 ${active ? 'bg-primary/15' : 'hover:bg-surfaceVariant/50'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black tracking-widest uppercase transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>
        {label}
      </span>
    </button>
  );
}
