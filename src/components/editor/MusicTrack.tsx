import React, { useState, useEffect } from 'react';
import { Search, Music, Play, Pause, Check, Volume2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { youtubeService, YouTubeTrack } from '../../services/youtubeService';
import { MusicItem } from './types';

interface MusicTrackProps {
  onAddMusic: (track: MusicItem) => void;
  activeMusic: MusicItem | null;
  onRemoveMusic: () => void;
}

export default function MusicTrack({
  onAddMusic,
  activeMusic,
  onRemoveMusic
}: MusicTrackProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<YouTubeTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<HTMLAudioElement | null>(null);

  // Load trending and viral sounds as the base pre-editor recommendation
  useEffect(() => {
    async function fetchTrending() {
      setIsLoading(true);
      try {
        const results = await youtubeService.getTrending();
        setTracks(results.slice(0, 8));
      } catch (err) {
        console.warn('Issue fetching trending list for CapCut workspace:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrending();
  }, []);

  // Cleanup active audio preview player on unmount
  useEffect(() => {
    return () => {
      if (audioPreview) {
        audioPreview.pause();
      }
    };
  }, [audioPreview]);

  // Handle music searches
  const handleQuerySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const results = await youtubeService.search(searchQuery);
      setTracks(results.slice(0, 10));
    } catch (e) {
      console.warn('Query failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger song previews with actual Audio element or a simulated visual sync
  const togglePreview = (track: YouTubeTrack) => {
    if (previewingTrackId === track.id) {
      if (audioPreview) audioPreview.pause();
      setPreviewingTrackId(null);
    } else {
      if (audioPreview) audioPreview.pause();
      
      const newAudio = new Audio(`https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3`); // Lightweight sample loop for performance
      newAudio.volume = 0.45;
      newAudio.play().catch(e => console.log('Audio loop wait:', e));
      setAudioPreview(newAudio);
      setPreviewingTrackId(track.id);
    }
  };

  return (
    <div id="music_panel_inner" className="space-y-4 text-left font-sans">
      <div className="space-y-1">
        <h3 className="text-xs font-black uppercase text-[#00df82] tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="animate-pulse" />
          <span>PureAudio Sónico</span>
        </h3>
        <p className="text-[10px] text-gray-400 leading-tight">
          Navega, escucha y monta pistas neón directamente de tu biblioteca musical o de tendencias.
        </p>
      </div>

      {/* Spotify Search Bar */}
      <form onSubmit={handleQuerySearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar canciones virales..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#12141A] text-xs py-2 pl-8 pr-3 rounded-lg border border-white/5 focus:border-[#00df82] focus:ring-1 focus:ring-[#00df82] outline-none text-white placeholder:text-gray-600 font-medium"
          />
        </div>
        <button 
          type="submit" 
          className="bg-[#12141A] hover:bg-[#1E212D] text-gray-300 hover:text-[#00df82] border border-white/5 hover:border-[#00df82] text-[10px] px-3 rounded-lg font-black uppercase tracking-wider transition-all"
        >
          Filtrar
        </button>
      </form>

      {/* Active Selection Badge */}
      {activeMusic && (
        <div className="bg-[#00df82]/10 border border-[#00df82]/30 rounded-xl p-3 flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={activeMusic.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover" />
            <div className="min-w-0">
              <span className="text-[10.5px] font-black block text-white truncate leading-tight uppercase">{activeMusic.title}</span>
              <span className="text-[8.5px] text-gray-400 block truncate leading-tight mt-0.5">{activeMusic.artist}</span>
            </div>
          </div>
          <button 
            onClick={onRemoveMusic}
            className="text-[9.5px] font-black uppercase tracking-wide px-2.5 py-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg border border-red-500/20 transition-all cursor-pointer"
          >
            Quitar
          </button>
        </div>
      )}

      {/* Library Scroll lists */}
      <div className="space-y-2">
        <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block">Recomendados:</span>
        <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center gap-2 text-gray-650">
              <RefreshCw className="w-4 h-4 animate-spin text-[#00df82]" />
              <span className="text-[9px] font-mono">ESTABLECIENDO FRECUENCIAS...</span>
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-6 flex flex-col items-center gap-1.5 text-gray-600 border border-white/[0.03] rounded-xl bg-black/15 text-center px-4">
              <AlertCircle size={14} />
              <p className="text-[9px] font-bold leading-normal">Introduce filtros o haz una búsqueda para encontrar pistas de audio.</p>
            </div>
          ) : (
            tracks.map((song) => {
              const isAdded = activeMusic?.id === song.id;
              const isPreviewing = previewingTrackId === song.id;

              return (
                <div 
                  key={song.id}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all hover:bg-black/45 ${
                    isAdded 
                      ? 'bg-[#00df82]/5 border-[#00df82]/30 text-white' 
                      : 'bg-black/20 border-white/5 hover:border-white/10 text-gray-300'
                  }`}
                >
                  {/* Thumbnail and Play indicator */}
                  <div className="relative w-8.5 h-8.5 rounded-lg overflow-hidden shrink-0">
                    <img src={song.thumbnail} alt="" className="w-full h-full object-cover select-none pointer-events-none" />
                    <button 
                      onClick={() => togglePreview(song)}
                      className="absolute inset-0 bg-black/55 hover:bg-black/70 flex items-center justify-center text-white transition-colors cursor-pointer"
                    >
                      {isPreviewing ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                    </button>
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[10.5px] font-black leading-none truncate uppercase tracking-tight text-white">{song.title}</p>
                    <p className="text-[8.5px] text-gray-500 truncate mt-1 leading-none font-medium">{song.artist}</p>
                  </div>

                  {/* Add action */}
                  <button
                    onClick={() => {
                      onAddMusic({
                        id: song.id,
                        title: song.title,
                        artist: song.artist,
                        thumbnail: song.thumbnail,
                        volume: 80,
                        trimStart: 0,
                        trimEnd: 15,
                        fadeIn: 1,
                        fadeOut: 1
                      });
                    }}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      isAdded 
                        ? 'bg-[#00df82] text-black font-extrabold' 
                        : 'bg-white/5 hover:bg-white/10 text-gray-400'
                    }`}
                  >
                    {isAdded ? <Check size={11} className="stroke-[3px]" /> : <Music size={11} />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
