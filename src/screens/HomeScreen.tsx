import React, { useEffect, useState } from 'react';
import { Play, Music2, UserPlus, UserCheck, Sparkles, Wand2, ArrowRight } from 'lucide-react';
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
    t
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6 text-center max-w-lg mx-auto">
        <div className="bg-white/5 p-12 rounded-3xl border border-white/10 space-y-4">
           <Music2 size={48} className="mx-auto text-gray-500 opacity-20" />
           <h1 className="text-xl font-bold">{t('something_wrong')}</h1>
           <p className="text-gray-400 text-sm">Failed to load recommendations. Please try again later.</p>
           <button 
             onClick={() => window.location.reload()}
             className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform"
           >
             {t('retry')}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Categories */}
      <div className="flex gap-2 sticky top-[-20px] bg-background/90 backdrop-blur-md pt-4 pb-2 z-10 px-4 md:px-6 -mx-4 md:-mx-6 border-b border-outline/10 overflow-x-auto scrollbar-hide">
        {[
          { id: 'All', label: t('cat_all') },
          { id: 'Music', label: t('cat_music') },
          { id: 'Podcasts', label: t('cat_podcasts') },
          { id: 'Audiobooks', label: t('cat_audiobooks') }
        ].map((cat) => (
          <button 
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === cat.id ? 'bg-primary text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Greetings Grid */}
      <header className="space-y-4">
        <h1 className="text-3xl font-black tracking-tight">{t('greetings')}</h1>

        {/* AI Mood Magic Bar */}
        <section className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 opacity-30 blur-2xl group-hover:opacity-50 transition-opacity duration-1000" />
          <div className="relative bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2">
               <div className="bg-primary/20 p-2 rounded-lg text-primary">
                  <Sparkles size={20} className="animate-pulse" />
               </div>
               <h2 className="text-xl font-black tracking-tight">{t('ai_mood')}</h2>
            </div>
            <p className="text-sm text-gray-400 max-w-lg">{t('ai_mood_desc')}</p>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">{t('target_age')}:</span>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {[
                    { label: t('age_kid'), val: 10 },
                    { label: t('age_teen'), val: 16 },
                    { label: t('age_genz'), val: 22 },
                    { label: t('age_millennial'), val: 35 },
                    { label: t('age_classic'), val: 55 }
                  ].map((age) => (
                    <button
                      key={age.val}
                      onClick={() => setSelectedAge(age.val === selectedAge ? null : age.val)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        selectedAge === age.val 
                          ? 'bg-primary border-primary text-black' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                      }`}
                    >
                      {age.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAiMood} className="relative flex items-center gap-2 max-w-2xl">
              <div className="absolute left-4 text-gray-500">
                <Wand2 size={16} />
              </div>
              <input 
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={t('search_placeholder')}
                disabled={isGenerating}
                className="w-full bg-white/5 border border-white/5 hover:border-primary/30 focus:border-primary rounded-xl pl-10 pr-12 py-4 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-gray-600 disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!aiPrompt.trim() || isGenerating}
                className="absolute right-2 px-4 py-2 bg-primary text-black rounded-lg font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:grayscale disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>{t('magic')} <ArrowRight size={14} /></>
                )}
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { label: 'Rainy City 🌧️', prompt: 'Música melancólica para una ciudad lluviosa de noche' },
                { label: 'Focus Flow 💻', prompt: 'Deep focus music for programming without lyrics' },
                { label: 'Gym Hype ⚡', prompt: 'High energy phonk and electronic music for heavy lifting' },
                { label: 'Sunset Chill 🌅', prompt: 'Vibras de atardecer en la playa, indie pop y surf rock' },
                { label: 'Cyberpunk 🌆', prompt: 'Aggressive synthwave and industrial music for a dark future' }
              ].map((mood) => (
                <button
                  key={mood.label}
                  type="button"
                  onClick={async () => {
                    setAiPrompt(mood.prompt);
                    // Explicitly call common function logic since we changed from a closure playTrack
                    if (isGenerating) return;
                    setIsGenerating(true);
                    setAiResults([]);
                    try {
                      const tracks = await youtubeService.getAiMoodTracks(mood.prompt, selectedAge || undefined);
                      setAiResults(tracks);
                    } catch (err) {
                      console.error('AI Generation error:', err);
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/50 text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  {mood.label}
                </button>
              ))}
            </div>

            {/* AI Results Section */}
            <AnimatePresence>
              {aiResults.length > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="pt-4 space-y-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t('ai_mix')}</p>
                    <button 
                      onClick={() => playTrack(aiResults[0], aiResults)}
                      className="flex items-center gap-2 text-[10px] font-black bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 rounded-full transition-colors"
                    >
                      <Play size={10} fill="currentColor" /> {t('play_all')}
                    </button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 md:-mx-6 px-4 md:px-6">
                    {aiResults.map((song) => (
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        key={`ai-${song.id}`}
                        onClick={() => playTrack(song, aiResults)}
                        className="min-w-[120px] w-32 space-y-2 cursor-pointer group"
                      >
                        <div className="relative aspect-square rounded-xl overflow-hidden shadow-xl ring-1 ring-white/5">
                          <img src={song.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play size={24} fill="white" stroke="white" />
                          </div>
                        </div>
                        <h4 className="text-[11px] font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">{song.title}</h4>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.greeting.map((song) => (
            <motion.div 
              whileHover={{ scale: 1.02, backgroundColor: 'var(--color-surfaceVariant)' }}
              whileTap={{ scale: 0.98 }}
              key={`greeting-${song.id}`}
              onClick={() => playTrack(song, allTracks)}
              className={`flex items-center gap-4 bg-surface/40 hover:bg-surfaceVariant/60 border border-outline/35 transition-all rounded-xl overflow-hidden group cursor-pointer h-20 shadow-lg ${
                currentTrack?.id === song.id ? 'bg-surfaceVariant border-primary/30 shadow-[0_4px_20px_rgb(0,223,130,0.05)]' : ''
              }`}
            >
              <div className="w-20 h-20 flex-shrink-0 relative">
                <img src={song.thumbnail} alt="" className="w-full h-full object-cover shadow-xl" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <h3 className={`font-black text-sm md:text-base truncate ${currentTrack?.id === song.id ? 'text-primary' : 'text-white'}`}>{song.title}</h3>
              </div>
              <div className={`pr-4 ${currentTrack?.id === song.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all transform translate-x-2 group-hover:translate-x-0`}>
                 <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black shadow-primary/20 shadow-xl scale-90 group-hover:scale-100 transition-transform">
                    <Play size={20} fill="currentColor" />
                 </div>
              </div>
            </motion.div>
          ))}
        </section>
      </header>

      {/* Jump back in */}
      {sections.trending.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">{t('jump_back_in')}</h2>
            <button className="text-gray-400 text-xs font-bold uppercase tracking-widest hover:underline">{t('show_all')}</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 md:-mx-6 px-4 md:px-6">
            {sections.trending.map((song) => (
              <div key={`jump-${song.id}`} className="min-w-[170px] sm:min-w-[190px] w-44 sm:w-48 flex-shrink-0">
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

      {/* Mood */}
      {sections.mood.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">{t('mood')}</h2>
            <button className="text-gray-400 text-xs font-bold uppercase tracking-widest hover:underline">{t('show_all')}</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
