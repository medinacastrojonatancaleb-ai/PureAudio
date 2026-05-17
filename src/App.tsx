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
    isPremium,
    togglePremium,
    isHighQuality,
    toggleHighQuality,
    downloadTrack,
    downloadedTracks,
    notification,
    notify,
    queue,
    language,
    setLanguage,
    t
  } = usePlayer();

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
    
    // Error 150/101 are the main "restricted" errors
    if ([101, 150].includes(code) && currentTrack) {
      console.warn(`Track ${currentTrack.title} is restricted. Searching for alternative...`);
      try {
        const results = await youtubeService.search(`${currentTrack.title} ${currentTrack.artist} topic`);
        // Filter out the current restricted ID
        const alternative = results.find(t => t.id !== currentTrack.id);
        if (alternative) {
           console.log('Found alternative track:', alternative.title, alternative.id);
           // When playing an alternative, keep the current queue
           playTrack(alternative, queue);
           return;
        }
      } catch (e) {
        console.error('Fallback search failed:', e);
      }
      
      // If no alternative found, just skip
      nextTrack();
    } else if ([2, 5, 100].includes(code)) {
      console.warn('Playing next track due to playback error:', code);
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
  const isDownloaded = currentTrack ? downloadedTracks.some(t => t.id === currentTrack.id) : false;

  return (
    <div className="flex h-screen bg-[#000000] text-white overflow-hidden font-sans select-none">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-80 bg-[#121212] m-2 rounded-xl overflow-hidden shadow-2xl">
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
                 <div className="p-4 rounded-xl bg-[#242424] space-y-4">
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
      <div className="flex-1 flex flex-col min-w-0 bg-[#121212] md:m-2 md:ml-0 rounded-xl overflow-hidden relative group/content">
        {/* Dynamic Background Gradient */}
        {currentTrack && (
          <div 
            className="absolute inset-0 z-0 transition-opacity duration-1000 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${'#1DB954'}33 0%, transparent 70%)`
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

        <header className="p-4 flex items-center justify-between z-20 absolute top-0 left-0 right-0 bg-gradient-to-b from-black/40 to-transparent">
          <div className="flex items-center gap-2 md:hidden">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-onPrimary">
                <Music2 size={18} />
             </div>
             <span className="font-black text-lg">PureAudio</span>
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
                onClick={login}
                className="flex items-center gap-2 bg-white text-black text-sm font-black px-5 py-2 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg group"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
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
                {isPremium && (
                  <div className="ml-2 px-1.5 py-0.5 rounded-sm bg-primary text-[8px] font-black text-black leading-none">
                    {t('premium_badge')}
                  </div>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-20 px-6 pb-24 scrollbar-hide">
          {!isPremium && (
            <div className="mb-8 p-3 rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 flex items-center justify-between gap-4 animate-pulse">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                     <VolumeX size={18} />
                  </div>
                  <p className="text-[10px] md:text-xs font-bold text-blue-200">
                    Get PureAudio Premium to listen without interruptions.
                  </p>
               </div>
               <button 
                 onClick={togglePremium}
                 className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
               >
                 Upgrade
               </button>
            </div>
          )}
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
                className="fixed bottom-24 left-2 right-2 bg-[#282828] rounded-xl p-2 flex items-center gap-3 shadow-2xl z-50 border border-white/5"
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
                  <p className="text-sm font-bold truncate leading-tight">
                    {currentTrack?.title || "Welcome"}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate uppercase tracking-tight">
                    {currentTrack?.artist || t('tap_to_play')}
                  </p>
                </div>
                <div className="flex items-center gap-2 pr-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
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
            className="hidden md:block fixed bottom-0 left-0 right-0 bg-black border-t border-white/5 h-24 px-4 z-[60]"
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
                    {isHighQuality && (
                      <span className="text-[8px] font-black border border-primary/40 text-primary/80 px-1 rounded-sm leading-none flex-shrink-0">HQ</span>
                    )}
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
      <nav className="md:hidden bg-black/80 backdrop-blur-2xl border-t border-white/5 h-20 flex items-center justify-around px-4 z-40 fixed bottom-0 left-0 right-0">
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

            <div className="relative z-10 flex flex-col h-full p-8 md:p-12 max-w-7xl mx-auto w-full">
              <header className="flex justify-between items-center mb-8 md:mb-12">
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <ChevronDown size={28} />
                </button>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">Playing from</p>
                  <p className="font-bold text-sm">{t('now_playing')}</p>
                </div>
                <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <MoreHorizontal size={24} />
                </button>
              </header>
  
              <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 overflow-y-auto scrollbar-hide py-8">
                {/* Album Art Section or Lyrics */}
                <AnimatePresence mode="wait">
                  {!showLyrics ? (
                    <motion.div 
                      key="album-art"
                      layoutId="player-art"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="w-full max-w-[320px] md:max-w-[450px] aspect-square rounded-2xl md:rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 flex-shrink-0 relative group"
                    >
                      <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                      
                      {/* Visualizer Overlay */}
                      {isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                          <div className="flex items-center justify-center gap-1 h-12">
                            {[...Array(5)].map((_, i) => (
                              <div 
                                key={i}
                                className="w-1 bg-primary rounded-full animate-visualizer"
                                style={{ 
                                  animationDelay: `${i * 0.18}s`,
                                  boxShadow: '0 0 8px rgba(29, 185, 84, 0.4)'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="lyrics"
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="w-full max-w-2xl h-[400px] md:h-full overflow-y-auto scrollbar-hide py-8 flex flex-col items-center"
                    >
                      {isLoadingLyrics ? (
                        <div className="flex flex-col items-center gap-4 mt-20">
                          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('summoning_lyrics')}</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-6">
                           <p className="text-2xl md:text-3xl font-black text-white/90 leading-relaxed whitespace-pre-wrap">
                             {lyrics || t('no_lyrics')}
                           </p>
                           <p className="text-xs text-gray-500 italic pb-20">{t('lyrics_by')}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
  
                {/* Control Center Section */}
                <div className="w-full max-w-[450px] flex flex-col gap-8 md:gap-12 flex-1">
                  <div className="space-y-2 text-center md:text-left">
                    <motion.h1 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-4xl md:text-6xl font-black tracking-tighter line-clamp-2"
                    >
                      {currentTrack.title}
                    </motion.h1>
                           <div className="flex flex-col items-center md:items-start">
                             <motion.p 
                               initial={{ y: 20, opacity: 0 }}
                               animate={{ y: 0, opacity: 1 }}
                               transition={{ delay: 0.1 }}
                               className="text-xl md:text-2xl text-primary font-bold truncate"
                             >
                               {currentTrack.artist}
                             </motion.p>
                             <button 
                               onClick={() => toggleFollowArtist({
                                 id: '',
                                 name: currentTrack.artist,
                                 thumbnail: currentTrack.thumbnail
                               })}
                               className={`mt-2 flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${
                                 followedArtists.some(a => a.name === currentTrack.artist)
                                   ? 'bg-primary border-primary text-black' 
                                   : 'bg-transparent border-white/20 text-white hover:border-white'
                               }`}
                             >
                               {followedArtists.some(a => a.name === currentTrack.artist) ? (
                                 <><UserCheck size={14} /> {t('following')}</>
                               ) : (
                                 <><UserPlus size={14} /> {t('follow_artist')}</>
                               )}
                             </button>
                           </div>
                  </div>
  
                  {/* Progress Section */}
                  <div className="w-full space-y-4">
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
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white group-hover/progress:bg-primary transition-colors" 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                      <div 
                        className="absolute w-4 h-4 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow-xl transition-opacity pointer-events-none"
                        style={{ left: `calc(${progress}% - 8px)` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
  
                  {/* Playback Controls */}
                  <div className="flex flex-col gap-8">
                    <div className="flex items-center justify-between md:justify-center md:gap-12">
                      <button 
                        onClick={toggleShuffle}
                        className={`p-2 transition-colors ${isShuffle ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                      >
                        <Shuffle size={28} />
                      </button>
                      <button onClick={prevTrack} className="p-2 text-white hover:text-primary transition-colors transform active:scale-90">
                        <SkipBack size={48} fill="currentColor" />
                      </button>
                      <button 
                        onClick={togglePlay}
                        className="w-20 md:w-24 h-20 md:h-24 rounded-full bg-white flex items-center justify-center text-black shadow-2xl hover:scale-105 active:scale-95 transition-all"
                      >
                        {isPlaying ? <Pause size={44} fill="currentColor" /> : <Play size={44} fill="currentColor" className="ml-1" />}
                      </button>
                      <button onClick={nextTrack} className="p-2 text-white hover:text-primary transition-colors transform active:scale-90">
                        <SkipForward size={48} fill="currentColor" />
                      </button>
                      <button 
                        onClick={toggleRepeat}
                        className={`p-2 transition-colors ${repeatMode !== 'none' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                      >
                        {repeatMode === 'one' ? <Repeat1 size={28} /> : <Repeat size={28} />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <button 
                           onClick={() => toggleLike(currentTrack)}
                           className={`flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors ${isLiked ? 'text-primary' : 'text-gray-400'}`}
                         >
                          <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
                          <span className="font-bold text-white">{t('save_liked')}</span>
                        </button>
                        <button 
                           onClick={() => downloadTrack(currentTrack)}
                           className={`flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors ${isDownloaded ? 'text-primary' : 'text-gray-400'}`}
                           title={isDownloaded ? t('remove_download') : t('offline_play')}
                         >
                          <div className={`relative ${isDownloaded ? 'text-primary' : ''}`}>
                             <ChevronDown size={24} className="rotate-180" />
                             <div className="absolute inset-x-0 bottom-1 h-0.5 bg-current mx-1 rounded-full" />
                          </div>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => showLyrics ? setShowLyrics(false) : fetchLyrics()}
                          className={`p-4 rounded-full transition-colors ${showLyrics ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`}
                          title="Lyrics"
                        >
                          <Music2 size={24} />
                        </button>
                        <button 
                          onClick={() => {
                            const url = `https://www.youtube.com/watch?v=${currentTrack.id}`;
                            navigator.clipboard.writeText(url);
                            notify(t('link_copied'), 'info');
                          }}
                          className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        >
                          <Share2 size={24} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
