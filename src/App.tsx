import React, { useState } from 'react';
import { 
  Home, Search, Library, PlayCircle, PauseCircle, Music2, Heart, History, User,
  ChevronDown, MoreHorizontal, SkipBack, SkipForward, Play, Pause, Volume2, Share2,
  Shuffle, Repeat, Repeat1
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
    user, 
    login, 
    logout, 
    toggleLike, 
    likedTracks,
    getLikeCount,
    queue,
    shuffleMode,
    setShuffleMode,
    repeatMode,
    setRepeatMode
  } = usePlayer();

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
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
        if (apiKey) {
          const results = await youtubeService.search(`${currentTrack.title} ${currentTrack.artist} topic`, apiKey);
          // Filter out the current restricted ID
          const alternative = results.find(t => t.id !== currentTrack.id);
          if (alternative) {
             console.log('Found alternative track:', alternative.title, alternative.id);
             // When playing an alternative, keep the current queue
             playTrack(alternative, queue);
             return;
          }
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

  return (
    <div className="flex h-screen bg-[#000000] text-white overflow-hidden font-sans select-none">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-80 bg-[#121212] m-2 rounded-xl overflow-hidden shadow-2xl">
        <nav className="p-6 space-y-4">
          <SidebarNavButton 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
            icon={<Home size={28} />} 
            label="Home" 
          />
          <SidebarNavButton 
            active={activeTab === 'search'} 
            onClick={() => setActiveTab('search')} 
            icon={<Search size={28} />} 
            label="Search" 
          />
          <SidebarNavButton 
            active={activeTab === 'library'} 
            onClick={() => setActiveTab('library')} 
            icon={<Library size={28} />} 
            label="Your Library" 
          />
        </nav>

        {/* Sidebar Player (Bottom) */}
        <div className="mt-auto p-4 border-t border-white/5 space-y-4 bg-gradient-to-b from-transparent to-black/20">
          {currentTrack ? (
            <div className="space-y-4">
              <div className="aspect-square w-full rounded-xl overflow-hidden shadow-2xl">
                <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg truncate leading-tight">{currentTrack.title}</h3>
                  <button onClick={() => toggleLike(currentTrack)} className={isLiked ? 'text-primary' : 'text-gray-400'}>
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                </div>
                <p className="text-gray-400 text-sm">{currentTrack.artist}</p>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-1">
                <input 
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime || 0}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, #1DB954 ${progress}%, rgba(255,255,255,0.1) ${progress}%)`
                  }}
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-4">
                  <button 
                    onClick={() => setShuffleMode(!shuffleMode)}
                    className={`transition-colors ${shuffleMode ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                  >
                    <Shuffle size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      if (repeatMode === 'off') setRepeatMode('queue');
                      else if (repeatMode === 'queue') setRepeatMode('track');
                      else setRepeatMode('off');
                    }}
                    className={`transition-colors ${repeatMode !== 'off' ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                  >
                    {repeatMode === 'track' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-6">
                  <button onClick={prevTrack} className="text-gray-400 hover:text-white transition-colors">
                    <SkipBack size={24} />
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black shadow-lg hover:scale-105 transition-transform"
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                  </button>
                  <button onClick={nextTrack} className="text-gray-400 hover:text-white transition-colors">
                    <SkipForward size={24} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-square w-full rounded-xl bg-white/5 flex items-center justify-center border border-dashed border-white/10">
              <Music2 size={40} className="text-white/20" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-[#1c1c1c] to-[#121212] md:m-2 md:ml-0 rounded-xl overflow-hidden relative">
        <header className="p-4 flex items-center justify-between z-20 absolute top-0 left-0 right-0">
          <div className="flex items-center gap-2 md:hidden">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-onPrimary">
                <Music2 size={18} />
             </div>
             <span className="font-black text-lg">PureAudio</span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <button 
              onClick={user ? logout : login}
              className="flex items-center gap-2 bg-black hover:bg-[#282828] transition-colors rounded-full p-1 pr-3"
            >
              <div className="w-7 h-7 rounded-full bg-[#333333] flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} />
                )}
              </div>
              <span className="text-xs font-bold text-white truncate max-w-[100px]">
                {user ? (user.displayName || 'User') : 'Log in'}
              </span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-20 px-6 pb-24 scrollbar-hide">
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
                    {currentTrack?.artist || "Tap a song to play"}
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

      {/* Bottom Nav (Mobile Only) */}
      <nav className="md:hidden bg-black/80 backdrop-blur-2xl border-t border-white/5 h-20 flex items-center justify-around px-4 z-40 fixed bottom-0 left-0 right-0">
        <NavButton 
          active={activeTab === 'home'} 
          onClick={() => setActiveTab('home')} 
          icon={<Home size={22} />} 
          label="Home" 
        />
        <NavButton 
          active={activeTab === 'search'} 
          onClick={() => setActiveTab('search')} 
          icon={<Search size={22} />} 
          label="Search" 
        />
        <NavButton 
          active={activeTab === 'library'} 
          onClick={() => setActiveTab('library')} 
          icon={<Library size={22} />} 
          label="Library" 
        />
      </nav>

      {/* Legacy Full Player for Mobile Expand */}
      <AnimatePresence>
        {isExpanded && currentTrack && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 bg-[#121212] z-[100] p-8 flex flex-col md:hidden"
          >
            <header className="flex justify-between items-center mb-8">
              <button 
                onClick={() => setIsExpanded(false)}
                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center"
              >
                <ChevronDown size={28} />
              </button>
              <h2 className="font-bold text-sm uppercase tracking-widest text-gray-500">Now Playing</h2>
              <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <MoreHorizontal size={24} />
              </button>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center gap-12">
              <motion.div 
                layoutId="player-art"
                className="w-full aspect-square max-w-sm rounded-3xl overflow-hidden shadow-2xl"
              >
                <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
              </motion.div>

              <div className="w-full space-y-2">
                <h1 className="text-3xl font-black text-center">{currentTrack.title}</h1>
                <p className="text-primary font-medium text-lg text-center">{currentTrack.artist}</p>
              </div>

              <div className="w-full space-y-4">
                <input 
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime || 0}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                  style={{
                    background: `linear-gradient(to right, #ffffff ${progress}%, rgba(255,255,255,0.1) ${progress}%)`
                  }}
                />
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="w-full flex items-center justify-between px-6">
                <button 
                  onClick={() => setShuffleMode(!shuffleMode)}
                  className={`transition-colors ${shuffleMode ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                >
                  <Shuffle size={24} />
                </button>
                <button 
                  onClick={() => {
                    if (repeatMode === 'off') setRepeatMode('queue');
                    else if (repeatMode === 'queue') setRepeatMode('track');
                    else setRepeatMode('off');
                  }}
                  className={`transition-colors ${repeatMode !== 'off' ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                >
                  {repeatMode === 'track' ? <Repeat1 size={24} /> : <Repeat size={24} />}
                </button>
              </div>

              <div className="flex items-center justify-center gap-8">
                <button onClick={prevTrack} className="p-2 text-white hover:text-primary transition-colors">
                  <SkipBack size={40} />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black shadow-xl"
                >
                  {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" />}
                </button>
                <button onClick={nextTrack} className="p-2 text-white hover:text-primary transition-colors">
                  <SkipForward size={40} />
                </button>
              </div>
            </div>

            <footer className="mt-8 flex justify-between items-center px-4">
              <button 
                onClick={() => toggleLike(currentTrack)}
                className={`transition-colors ${isLiked ? 'text-primary' : 'text-gray-500'}`}
              >
                <Heart size={32} fill={isLiked ? "currentColor" : "none"} />
              </button>
              <div className="flex items-center gap-2 flex-1 mx-8 text-gray-500">
                <Volume2 size={24} />
                <input 
                  type="range" 
                  min="0" max="1" step="0.1" 
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 accent-white h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <button className="text-gray-500">
                <Share2 size={28} />
              </button>
            </footer>
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
