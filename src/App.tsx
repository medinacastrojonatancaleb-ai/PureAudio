import React, { useState } from 'react';
import { 
  Home, Search, Library, PlayCircle, PauseCircle, Music2, Heart, History, User,
  ChevronDown, MoreHorizontal, SkipBack, SkipForward, Play, Pause, Volume2, Share2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import LibraryScreen from './screens/LibraryScreen';
import { usePlayer } from './context/PlayerContext';
import YouTubePlayer from './components/YouTubePlayer';

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
    nextTrack,
    prevTrack,
    togglePlay, 
    volume, 
    setVolume, 
    user, 
    login, 
    logout, 
    toggleLike, 
    likedTracks,
    getLikeCount 
  } = usePlayer();

  const handlePlayerError = (code: number) => {
    console.error('Player error code:', code);
    // Error 150/101 are "not allowed to play in embedded player"
    if ([101, 150, 2, 5, 100].includes(code)) {
      nextTrack();
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
    <div className="flex flex-col h-screen bg-background text-onBackground overflow-hidden font-sans">
      {/* Header */}
      <header className="p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center text-onPrimary shadow-lg shadow-primary/20"
          >
            <Music2 size={26} />
          </motion.div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">PureAudio</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
              {user ? (user.displayName || 'User') : 'Guest'}
            </p>
          </div>
        </div>
        <button 
          onClick={user ? logout : login}
          className="w-10 h-10 rounded-full bg-surfaceVariant flex items-center justify-center border border-outline/10 overflow-hidden"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={20} />
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-40 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Full Screen Player */}
      <AnimatePresence>
        {isExpanded && currentTrack && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-background z-[100] p-8 flex flex-col"
          >
            {/* ... rest of the player UI ... */}
            <header className="flex justify-between items-center mb-8">
              <button 
                onClick={() => setIsExpanded(false)}
                className="w-12 h-12 rounded-full bg-surfaceVariant flex items-center justify-center"
              >
                <ChevronDown size={28} />
              </button>
              <h2 className="font-bold text-sm uppercase tracking-widest text-onSurfaceVariant">Now Playing</h2>
              <button className="w-12 h-12 rounded-full bg-surfaceVariant flex items-center justify-center">
                <MoreHorizontal size={24} />
              </button>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center gap-12">
              <motion.div 
                layoutId="player-art"
                className="w-full aspect-square max-w-sm rounded-[32px] overflow-hidden shadow-2xl shadow-primary/20"
              >
                <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
              </motion.div>

              <div className="w-full text-center space-y-2">
                <h1 className="text-3xl font-black">{currentTrack.title}</h1>
                <p className="text-primary font-medium text-lg">{currentTrack.artist}</p>
              </div>

              <div className="w-full space-y-2">
                <div className="h-1.5 w-full bg-surfaceVariant rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isPlaying ? "40%" : "30%" }}
                    className="h-full bg-primary"
                  />
                </div>
                <div className="flex justify-between text-xs font-bold text-onSurfaceVariant">
                  <span>Likes: {getLikeCount(currentTrack.id)}</span>
                  <span>3:45</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-8">
                <button onClick={prevTrack} className="p-2 text-onBackground hover:text-primary transition-colors">
                  <SkipBack size={32} />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-onPrimary shadow-xl shadow-primary/30"
                >
                  {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" />}
                </button>
                <button onClick={nextTrack} className="p-2 text-onBackground hover:text-primary transition-colors">
                  <SkipForward size={32} />
                </button>
              </div>
            </div>

            <footer className="mt-8 flex justify-between items-center">
              <button 
                onClick={() => toggleLike(currentTrack)}
                className={`transition-colors ${isLiked ? 'text-primary' : 'text-onSurfaceVariant'}`}
              >
                <Heart size={28} fill={isLiked ? "currentColor" : "none"} />
              </button>
              <div className="flex items-center gap-2 flex-1 mx-8 text-onSurfaceVariant">
                <Volume2 size={24} />
                <input 
                  type="range" 
                  min="0" max="1" step="0.1" 
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 accent-primary h-1 bg-surfaceVariant rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <Share2 size={24} />
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Player */}
      <AnimatePresence>
        {!isExpanded && currentTrack && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-24 left-4 right-4 bg-surfaceVariant/60 backdrop-blur-xl rounded-[24px] p-2.5 flex items-center gap-3 shadow-2xl z-50 border border-white/10"
            onClick={() => setIsExpanded(true)}
          >
            <motion.div 
              layoutId="player-art"
              className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden bg-primary/10 shadow-inner"
            >
              {currentTrack?.thumbnail ? (
                <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <Music2 size={22} className="text-primary" />
              )}
            </motion.div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black text-onSurface truncate leading-tight">
                {currentTrack?.title || "Welcome"}
              </p>
              <p className="text-[11px] font-bold text-primary truncate uppercase tracking-tight">
                {currentTrack?.artist || "Tap a song to play"}
              </p>
            </div>
            <div className="flex items-center gap-2 pr-2">
              <button 
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="w-11 h-11 rounded-full flex items-center justify-center text-primary bg-primary/10"
              >
                {isPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <YouTubePlayer 
        videoId={currentTrack?.id} 
        isPlaying={isPlaying} 
        volume={volume} 
        onTrackEnd={nextTrack}
        onError={handlePlayerError}
      />

      {/* Bottom Nav */}
      <nav className="bg-background/80 backdrop-blur-2xl border-t border-outline/5 h-20 flex items-center justify-around px-4 z-40 fixed bottom-0 left-0 right-0">
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
          label="Explore" 
        />
        <NavButton 
          active={activeTab === 'library'} 
          onClick={() => setActiveTab('library')} 
          icon={<Library size={22} />} 
          label="Library" 
        />
      </nav>
    </div>
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
