import React, { useEffect, useState } from 'react';
import { Play, Music2, UserPlus, UserCheck, Sparkles, Wand2, ArrowRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayer } from '../context/PlayerContext';
import { youtubeService, YouTubeTrack } from '../services/youtubeService';
import { AudioTrackGridCard } from '../components/AestheticEnhancements';

export default function HomeScreen() {
  const { 
    playTrack, 
    currentTrack, 
    followedArtists, 
    toggleFollowArtist,
    likedTracks,
    toggleLike,
    t,
    language
  } = usePlayer();
  const [activeCategory, setActiveCategory] = useState('All');
  const [sections, setSections] = useState<{
    greeting: YouTubeTrack[];
    trending: YouTubeTrack[];
    mood: YouTubeTrack[];
  }>({ greeting: [], trending: [], mood: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'general' | null>(null);

  // AI Mood State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResults, setAiResults] = useState<YouTubeTrack[]>([]);
  const [selectedAge, setSelectedAge] = useState<number | null>(null);

  // Active mood chip override mapping
  const [activeMoodChip, setActiveMoodChip] = useState('Chill');

  // Animated placeholder state for the AI search input selector
  const placeholders = [
    language === 'es' ? 'Quiero música para manejar de noche...' : 'I want late night driving music...',
    language === 'es' ? 'Necesito motivación para entrenar...' : 'Give me high energy workout tracks...',
    language === 'es' ? 'Estoy triste pero quiero relajarme...' : 'I feel sad but need calming acoustics...',
    language === 'es' ? 'Sintoniza algo para jugar con mis amigos...' : 'Futuristic beats for gaming sessions...'
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [language]);

  const handleAiMood = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setAiResults([]);
    try {
      const tracks = await youtubeService.getAiMoodTracks(aiPrompt, selectedAge || undefined);
      if (tracks.length > 0) {
        setAiResults(tracks);
      }
    } catch (err) {
      console.error('AI Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        let greetingTracks: YouTubeTrack[] = [];
        let trendingTracks: YouTubeTrack[] = [];
        let moodTracks: YouTubeTrack[] = [];

        if (activeCategory === 'All' || activeCategory === 'Music') {
          const results = await Promise.allSettled([
            youtubeService.getPlayableTracks('Kevin Kaarl'),
            youtubeService.getPlayableTracks('Ed Maverick'),
            youtubeService.getTrending(),
          ]);
          
          if (results[0].status === 'fulfilled') greetingTracks.push(...results[0].value.slice(0, 3));
          if (results[1].status === 'fulfilled') greetingTracks.push(...results[1].value.slice(0, 3));
          
          if (results[2].status === 'fulfilled') trendingTracks = results[2].value;
          
          if (results[1].status === 'fulfilled') moodTracks.push(...results[1].value.slice(3, 6));
          if (results[0].status === 'fulfilled') moodTracks.push(...results[0].value.slice(3, 5));
        } else if (activeCategory === 'Podcasts') {
          const results = await Promise.allSettled([
            youtubeService.getPlayableTracks('Lex Fridman Podcast'),
            youtubeService.getPlayableTracks('The Daily Podcast'),
            youtubeService.getPlayableTracks('Comedy Podcast'),
          ]);
          if (results[0].status === 'fulfilled') greetingTracks.push(...results[0].value.slice(0, 3));
          if (results[1].status === 'fulfilled') greetingTracks.push(...results[1].value.slice(0, 3));
          if (results[2].status === 'fulfilled') trendingTracks = results[2].value;
          if (results[1].status === 'fulfilled') moodTracks.push(...results[1].value.slice(3, 6));
          if (results[0].status === 'fulfilled') moodTracks.push(...results[0].value.slice(3, 6));
        } else if (activeCategory === 'Audiobooks') {
          const results = await Promise.allSettled([
            youtubeService.getPlayableTracks('Classic Audiobook Full'),
            youtubeService.getPlayableTracks('Sci-Fi Audiobook Full'),
            youtubeService.getPlayableTracks('Philosophy Audiobook Full'),
          ]);
          if (results[0].status === 'fulfilled') greetingTracks.push(...results[0].value.slice(0, 3));
          if (results[1].status === 'fulfilled') greetingTracks.push(...results[1].value.slice(0, 3));
          if (results[2].status === 'fulfilled') trendingTracks = results[2].value;
          if (results[1].status === 'fulfilled') moodTracks.push(...results[1].value.slice(3, 6));
          if (results[0].status === 'fulfilled') moodTracks.push(...results[0].value.slice(3, 6));
        }

        if (greetingTracks.length === 0 && trendingTracks.length === 0 && moodTracks.length === 0) {
           throw new Error('No content could be loaded');
        }
        
        setSections({
          greeting: greetingTracks,
          trending: trendingTracks,
          mood: moodTracks
        });
      } catch (err: any) {
        console.error('Home load error:', err);
        setError('general');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeCategory]);

  const allTracks = React.useMemo(() => [...sections.greeting, ...sections.trending, ...sections.mood], [sections]);

  const triggerMoodSuggestion = async (moodPrompt: string, chipLabel: string) => {
    setActiveMoodChip(chipLabel);
    setAiPrompt(moodPrompt);
    if (isGenerating) return;
    setIsGenerating(true);
    setAiResults([]);
    try {
      const tracks = await youtubeService.getAiMoodTracks(moodPrompt, selectedAge || undefined);
      setAiResults(tracks);
    } catch (err) {
      console.error('AI Mood suggestion error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00df82]">{language === 'es' ? 'SINTONIZANDO...' : 'TUNING FREQUENCY...'}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6 text-center max-w-lg mx-auto">
        <div className="bg-[#12151c]/60 backdrop-blur-2xl p-12 rounded-3xl border border-white/10 space-y-4 shadow-2xl">
           <Music2 size={48} className="mx-auto text-[#ff2e54] opacity-80 animate-bounce" />
           <h1 className="text-xl font-bold">{t('something_wrong')}</h1>
           <p className="text-gray-400 text-sm">Failed to load recommendations. Please check your internet link.</p>
           <button 
             onClick={() => window.location.reload()}
             className="bg-primary text-black px-6 py-2 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
           >
             {t('retry')}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 pb-12">
      {/* Millimetric Transparent Glassmorphism Header */}
      <div className="flex justify-between items-center bg-[#050505]/20 backdrop-blur-md pt-4 pb-2 z-10 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-white/[0.03] sticky top-[-20px]">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] leading-none">
            {language === 'es' ? 'Buenas noches, Sandra' : 'Good evening, Sandra'}
          </h1>
          <p className="text-xs md:text-sm text-gray-400 font-medium mt-1">
            {language === 'es' ? 'Tu vibra de esta noche se siente increíble ✨' : 'Your vibe tonight feels extraordinary ✨'}
          </p>
        </div>

        {/* Pulse Glowing Profile Avatar */}
        <motion.div 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative w-12 h-12 rounded-full cursor-pointer flex-shrink-0 flex items-center justify-center p-[2px] transition-all"
        >
          {/* Intense neon circle halo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-[#00cbff] opacity-80 animate-pulse blur-[4px] pointer-events-none" />
          <div className="absolute inset-[3px] rounded-full bg-black z-0" />
          
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
            alt="User profile" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full relative z-10 border border-white/10"
          />
        </motion.div>
      </div>

      {/* Hero Category Filters */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1 -mx-4 px-4 md:-mx-6 md:px-6">
        {[
          { id: 'All', label: t('cat_all') },
          { id: 'Music', label: t('cat_music') },
          { id: 'Podcasts', label: t('cat_podcasts') },
          { id: 'Audiobooks', label: t('cat_audiobooks') }
        ].map((cat) => (
          <button 
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wide uppercase transition-all ${
              activeCategory === cat.id 
                ? 'bg-gradient-to-r from-primary to-[#00eaae] text-black shadow-lg shadow-primary/20 scale-102' 
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Giant "Magia IA" Hero section */}
      <section className="relative rounded-[24px] overflow-hidden border border-white/5 shadow-xl bg-gradient-to-br from-[#0c0f14] via-[#051c15] to-[#04151a]">
        {/* Soft floating background light mesh */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-primary/5 rounded-full blur-[80px] pointer-events-none animate-pulse" />
        <div className="absolute -left-10 bottom-0 w-40 h-40 bg-[#00cbff]/5 rounded-full blur-[60px] pointer-events-none" />

        <div className="p-4 md:p-5 space-y-3.5 relative z-10">
          
          {/* Header row containing rotating AI icon - streamlined */}
          <div className="flex items-center gap-3">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
              className="bg-primary/10 p-2.5 rounded-2xl text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,223,130,0.15)] flex-shrink-0"
            >
              <Sparkles size={18} className="animate-pulse" />
            </motion.div>
            
            <div className="space-y-0.5">
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight font-sans">
                {language === 'es' ? 'Magia IA' : 'Gemini Core Magic'}
              </h2>
              <p className="text-[10px] md:text-xs text-gray-400">
                {language === 'es' ? 'Describe tu estado de ánimo para crear la vibra perfecta.' : 'Describe your state of mind to formulate the vibe.'}
              </p>
            </div>
          </div>

          {/* Interactive Mood selector chips container - tighter padding */}
          <div className="space-y-2 pt-0.5">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-0.5">
              {[
                { label: 'Niño 🧸', val: 'Niño', prompt: 'Música divertida, infantil, alegre e instrumental' },
                { label: 'Joven 🎒', val: 'Joven', prompt: 'Trap contemporáneo y pop juvenil moderno latino' },
                { label: 'Gen Z 🎧', val: 'Gen Z', prompt: 'Hyperpop, phonk, dark pop and viral tik tok trends' },
                { label: 'Gamer 🎮', val: 'Gamer', prompt: '8-bit synthwave, active gameplay beats, chill lofi gaming' },
                { label: 'Focus 💻', val: 'Focus', prompt: 'Deep focal coding noise, synth sweeps, study background beats' },
                { label: 'Gym ⚡', val: 'Gym', prompt: 'High energy heavy techno bass and motivating drill beats' },
                { label: 'Chill 🌊', val: 'Chill', prompt: 'Quiet acoustic bedroom pop indie folk sunset' },
                { label: 'Noche 🌌', val: 'Noche', prompt: 'Late night dark drive synthwave and retro pop' },
                { label: 'Relax 🍵', val: 'Relax', prompt: 'Tibetan sound bowl resonance, ultra slow ambient waves' }
              ].map((mood) => {
                const isActive = activeMoodChip === mood.val;
                return (
                  <motion.button
                    key={mood.val}
                    type="button"
                    onClick={() => triggerMoodSuggestion(mood.prompt, mood.val)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-full tracking-wider transition-all whitespace-nowrap min-w-max border ${
                      isActive 
                        ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgba(0,223,130,0.4)] font-black' 
                        : 'bg-black/30 hover:bg-black/50 text-gray-300 border-white/5 hover:border-white/10'
                    }`}
                  >
                    {mood.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Sparkly dynamic AI input - much thinner coordinates */}
          <form onSubmit={handleAiMood} className="space-y-3">
            <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/5 hover:border-primary/40 focus-within:border-primary rounded-xl transition-all focus-within:ring-2 focus-within:ring-primary/10 shadow-inner">
              <div className="absolute left-3.5 text-primary/70">
                <Wand2 size={16} className="animate-pulse" />
              </div>

              {/* Input with animated placeholder text - thinner */}
              <input 
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={placeholders[placeholderIndex]}
                disabled={isGenerating}
                className="w-full bg-transparent border-none py-3 pl-10 pr-24 text-xs text-white focus:outline-none placeholder:text-gray-500 font-medium"
              />

              <motion.button 
                type="submit"
                disabled={!aiPrompt.trim() || isGenerating}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="absolute right-1.5 px-3.5 py-1.5 bg-gradient-to-r from-primary to-[#00cbff] text-black rounded-lg font-black text-[9px] uppercase tracking-wider shadow-md disabled:grayscale disabled:opacity-30 flex items-center gap-1"
              >
                {isGenerating ? (
                  <div className="w-2.5 h-2.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>MAGIA</>
                )}
              </motion.button>
            </div>
          </form>

          {/* AI Results Subsection render - tighter spacing */}
          <AnimatePresence>
            {aiResults.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pt-4 border-t border-white/5 space-y-3 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                    {language === 'es' ? 'Sintonizado' : 'AI Tuned'}
                  </span>
                  <button 
                    onClick={() => playTrack(aiResults[0], aiResults)}
                    className="flex items-center gap-1 text-[9px] font-black bg-primary/15 hover:bg-primary/25 text-primary px-3 py-1 rounded-full transition-all border border-primary/10"
                  >
                    <Play size={8} fill="currentColor" /> {t('play_all')}
                  </button>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-1.5 scrollbar-hide -mx-4 px-4">
                  {aiResults.map((song) => (
                    <motion.div 
                      key={`ai-${song.id}`}
                      onClick={() => playTrack(song, aiResults)}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.96 }}
                      className="min-w-[110px] w-28 space-y-1.5 cursor-pointer group"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg border border-white/5 bg-[#12151c]">
                        <img src={song.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black shadow-lg">
                            <Play size={12} fill="currentColor" className="ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-[10px] font-black text-white line-clamp-1 group-hover:text-primary transition-colors leading-snug">{song.title}</h4>
                        <p className="text-[9px] font-bold text-gray-500 truncate leading-tight">{song.artist}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Primary Track recommendations listing */}
      <section className="space-y-5">
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight font-sans">
          {language === 'es' ? 'Recomendado para Sandra' : 'Curated for Sandra'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.greeting.map((song) => {
            const isPlayingThis = currentTrack?.id === song.id;
            return (
              <motion.div 
                key={`greeting-${song.id}`}
                onClick={() => playTrack(song, allTracks)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-4 bg-[#0b0c0f]/70 hover:bg-[#12151c]/90 border border-white/[0.04] transition-all rounded-2xl overflow-hidden group cursor-pointer p-2.5 shadow-lg relative ${
                  isPlayingThis ? 'border-primary/30 bg-[#12151c]/90 shadow-[0_0_24px_rgba(0,223,130,0.06)]' : ''
                }`}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative">
                  <img src={song.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className={`font-black text-sm truncate leading-snug ${isPlayingThis ? 'text-primary' : 'text-white'}`}>
                    {song.title}
                  </h3>
                  <p className="text-[11px] font-bold text-gray-500 truncate leading-tight mt-0.5">{song.artist}</p>
                </div>
                
                <div className={`pr-2 ${isPlayingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all`}>
                  <div className="w-9 h-9 bg-primary text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                    <Play size={16} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Jump back in Slider */}
      {sections.trending.length > 0 && (
        <section className="space-y-5 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight font-sans">{t('jump_back_in')}</h2>
            <button className="text-gray-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">{t('show_all')}</button>
          </div>
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:-mx-6 md:px-6">
            {sections.trending.map((song) => (
              <div key={`jump-${song.id}`} className="min-w-[160px] sm:min-w-[185px] w-42 sm:w-46 flex-shrink-0">
                <AudioTrackGridCard 
                  track={song}
                  isActive={currentTrack?.id === song.id}
                  onPlay={() => playTrack(song, allTracks)}
                  onLikeToggle={(e) => {
                    e.stopPropagation();
                    toggleLike(song);
                  }}
                  isLiked={likedTracks.some(t => t.id === song.id)}
                  t={t}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Generic Mood Slider */}
      {sections.mood.length > 0 && (
        <section className="space-y-5 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight font-sans">{t('mood')}</h2>
            <button className="text-gray-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">{t('show_all')}</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {sections.mood.map((song) => (
              <AudioTrackGridCard 
                key={`mood-${song.id}`}
                track={song}
                isActive={currentTrack?.id === song.id}
                onPlay={() => playTrack(song, allTracks)}
                onLikeToggle={(e) => {
                  e.stopPropagation();
                  toggleLike(song);
                }}
                isLiked={likedTracks.some(t => t.id === song.id)}
                t={t}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
