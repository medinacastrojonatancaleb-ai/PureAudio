import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, Sliders, Music, Type, Flame, Play, Pause, FastForward, Check, 
  RotateCcw, SlidersHorizontal, Sparkles, Smile, Video, ArrowLeft, Volume2, 
  ChevronRight, RefreshCw, Upload, Download, Trash2, Heart, Music2
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { youtubeService, YouTubeTrack } from '../services/youtubeService';

interface VideoFilter {
  id: string;
  name: string;
  class: string;
  glow: string;
}

interface CaptionSnippet {
  text: string;
  start: number;
  end: number;
}

const PRESET_FILTERS: VideoFilter[] = [
  { id: 'none', name: 'Original', class: 'filter-none', glow: '' },
  { id: 'cyberpunk', name: 'Cyber Neon', class: 'hue-rotate-270 saturate-200 contrast-125 sepia-15 brightness-95', glow: 'shadow-[#d946ef]/50' },
  { id: 'vaporwave', name: 'Vaporwave', class: 'hue-rotate-185 saturate-150 brightness-110 sepia-10', glow: 'shadow-[#00cbff]/50' },
  { id: 'vhs', name: 'Vintage VHS', class: 'contrast-110 saturate-90 brightness-90 grayscale-[10%] sepia-[15%]', glow: 'shadow-[#00df82]/50' },
  { id: 'golden', name: 'Golden Hour', class: 'sepia contrast-95 saturate-125 brightness-105', glow: 'shadow-yellow-500/50' },
  { id: 'noir', name: 'Mono Noir', class: 'grayscale contrast-150 brightness-90 saturate-0', glow: 'shadow-white/20' }
];

const PRESET_STICKERS = ['🔥', '🎵', '⚡', '🎧', '👾', '🌈', '👑', '✨', '🎸', '🌟'];

const SUBTITLE_PRESETS: CaptionSnippet[] = [
  { text: "⚡ ESTA SECCIÓN SE SIENTE INCREÍBLE ⚡", start: 1.0, end: 3.5 },
  { text: "🎵 Sentí el bajo correr por mis venas... 🎵", start: 4.0, end: 7.2 },
  { text: "✨ Sintonizando frecuencias nocturnas ✨", start: 8.0, end: 11.5 },
  { text: "👾 VibeSonic: Tu música, tu multiverso 👾", start: 12.0, end: 15.0 }
];

export default function VideoEditorScreen({ onClose }: { onClose?: () => void }) {
  const { language, playTrack, currentTrack } = usePlayer();
  const [activeTab, setActiveTab] = useState<'trim' | 'filter' | 'music' | 'text'>('trim');
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [speed, setSpeed] = useState<0.5 | 1.0 | 1.5 | 2.0>(1.0);
  
  // Trimming timeline limits
  const [trimStart, setTrimStart] = useState(15); // Percentage
  const [trimEnd, setTrimEnd] = useState(85); // Percentage
  
  // Visual Filters
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const [glitchIntensity, setGlitchIntensity] = useState(30);

  // Background Audio Integration
  const [trendingTracks, setTrendingTracks] = useState<YouTubeTrack[]>([]);
  const [selectedBgTrack, setSelectedBgTrack] = useState<YouTubeTrack | null>(null);
  const [bgVolume, setBgVolume] = useState(80);
  const [isTracksLoading, setIsTracksLoading] = useState(false);

  // Text Subtitles & Stickers Overlays
  const [autoSubtitlesEnabled, setAutoSubtitlesEnabled] = useState(false);
  const [isGeneratingSubs, setIsGeneratingSubs] = useState(false);
  const [addedStickers, setAddedStickers] = useState<{ id: number; symbol: string; x: number; y: number }[]>([]);
  const [editorText, setEditorText] = useState('');
  const [placedText, setPlacedText] = useState<{ id: number; val: string; color: string; scale: number }[]>([]);

  // Simulation export settings
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExportDone, setIsExportDone] = useState(false);

  // Simulation video play progression
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlaybackTime(prev => {
        const span = trimEnd - trimStart;
        const speedFactor = speed;
        const next = prev + (speedFactor * 0.4);
        if (next > span) {
          return 0; // Loop around within trim span
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, trimStart, trimEnd, speed]);

  // Load backing tracks on component mount
  useEffect(() => {
    async function loadTracks() {
      setIsTracksLoading(true);
      try {
        const res = await youtubeService.getTrending();
        setTrendingTracks(res.slice(0, 10));
      } catch (e) {
        console.warn('Error loading backup tracks in editor:', e);
      } finally {
        setIsTracksLoading(false);
      }
    }
    loadTracks();
  }, []);

  const handleGenerateSubtitles = () => {
    setIsGeneratingSubs(true);
    setTimeout(() => {
      setIsGeneratingSubs(false);
      setAutoSubtitlesEnabled(true);
    }, 2800);
  };

  const handleAddSticker = (sticker: string) => {
    setAddedStickers(prev => [
      ...prev, 
      {
        id: Date.now(),
        symbol: sticker,
        x: Math.random() * 50 + 25, // Percentage bounds
        y: Math.random() * 40 + 20
      }
    ]);
  };

  const removeSticker = (id: number) => {
    setAddedStickers(prev => prev.filter(s => s.id !== id));
  };

  const handleAddCustomText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorText.trim()) return;
    setPlacedText(prev => [
      ...prev,
      {
        id: Date.now(),
        val: editorText,
        color: '#00df82',
        scale: 1.0
      }
    ]);
    setEditorText('');
  };

  const startExportSimulation = () => {
    setIsExporting(true);
    setExportProgress(0);
    setIsExportDone(false);
  };

  useEffect(() => {
    if (!isExporting) return;
    const timer = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsExporting(false);
          setIsExportDone(true);
          return 100;
        }
        return prev + Math.floor(Math.random() * 12 + 6);
      });
    }, 380);
    return () => clearInterval(timer);
  }, [isExporting]);

  // Active filter style resolver
  const activeFilterObj = PRESET_FILTERS.find(f => f.id === activeFilter) || PRESET_FILTERS[0];

  // Dynamic active subtitles matching playtime
  const getActiveSubtitleText = () => {
    if (!autoSubtitlesEnabled) return null;
    const currentSecond = (playbackTime / 4) % 15; // Simulated seconds
    const active = SUBTITLE_PRESETS.find(s => currentSecond >= s.start && currentSecond <= s.end);
    return active ? active.text : null;
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white overflow-hidden select-none">
      {/* Header Bar */}
      <header className="flex justify-between items-center p-4 border-b border-white/5 bg-[#0a0c10] shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-[10px] font-mono font-black text-red-500 uppercase tracking-widest">PRO CREATIVE</span>
            </div>
            <h1 className="text-sm font-black text-white tracking-tight">
              {language === 'es' ? 'Editor de Contenido' : 'Video & Audio Workspace'}
            </h1>
          </div>
        </div>

        <button 
          onClick={startExportSimulation}
          className="bg-primary text-black font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-[0_0_20px_rgba(3,221,130,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Upload size={13} />
          {language === 'es' ? 'Exportar' : 'Export Loop'}
        </button>
      </header>

      {/* Main Column Grid layout for device preview vs editing panel */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Column: Heavy Video Canvas Viewport Mockup */}
        <div className="flex-1 bg-black/90 p-4 flex flex-col justify-center items-center relative overflow-hidden border-r border-white/5 max-h-[50vh] md:max-h-none">
          {/* Subtle Cyberpunk Neon Gradients */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#ff2e54]/5 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[90px] pointer-events-none" />

          {/* Holographic Video Screen Wrapper */}
          <div className="relative w-full max-w-[280px] aspect-[9/16] bg-[#0c0d12] rounded-[36px] overflow-hidden border-2 border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.8)] flex flex-col">
            
            {/* Visual Screen feed */}
            <div className={`relative flex-1 bg-gradient-to-tr from-[#1b091f] via-[#05141e] to-[#041a12] overflow-hidden flex flex-col justify-between p-4 ${activeFilterObj.class}`}>
              
              {/* Screen Info header overlay */}
              <div className="flex justify-between items-center text-[10px] font-mono text-white/50 z-10 select-none">
                <span className="flex items-center gap-1"><Video size={10} className="text-red-500" /> REC - SYNCED</span>
                <span>00:0{Math.floor((playbackTime / 4) % 60)} / 00:15</span>
              </div>

              {/* Central Audio Ripple waveform illustration */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-1 opacity-25">
                  {[1,2,3,4,3,4,5,4,3,2,3,4,5,6,5,4,3,2,1].map((h, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: isPlaying ? [10, h * 12, 10] : 10 }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.05 }}
                      className="w-1 bg-gradient-to-t from-primary to-cyan-400 rounded-full"
                    />
                  ))}
                </div>
              </div>

              {/* Embedded Interactive Backing Music Badge */}
              {selectedBgTrack && (
                <div className="absolute top-10 left-3 right-3 bg-black/70 backdrop-blur-md rounded-xl p-1.5 border border-white/10 flex items-center gap-2 z-10 animate-fade-in text-[9.5px]">
                  <img src={selectedBgTrack.thumbnail} alt="" className="w-6 h-6 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate leading-none">{selectedBgTrack.title}</p>
                    <p className="text-gray-400 truncate leading-none mt-0.5">{selectedBgTrack.artist}</p>
                  </div>
                  <Volume2 size={11} className="text-primary" />
                </div>
              )}

              {/* Dynamic Subtitles Rendering (Style Karaoke) */}
              <div className="absolute inset-x-4 bottom-14 z-10 text-center pointer-events-none">
                <AnimatePresence mode="wait">
                  {getActiveSubtitleText() && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-black/80 backdrop-blur-sm border border-primary/20 px-3 py-1.5 rounded-full text-[10px] font-black text-primary tracking-wide leading-snug uppercase shadow-lg shadow-black/60 inline-flex items-center gap-1.5"
                    >
                      <Sparkles size={10} className="animate-spin text-white" />
                      {getActiveSubtitleText()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Draggable/Added Stickers and Text Layers */}
              {addedStickers.map((sticker) => (
                <motion.div
                  drag
                  dragConstraints={{ left: 0, right: 240, top: 0, bottom: 400 }}
                  key={sticker.id}
                  style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
                  className="absolute z-20 cursor-move text-3xl hover:ring-2 hover:ring-primary rounded-lg p-1 group select-none ease-out"
                >
                  {sticker.symbol}
                  <button 
                    onClick={() => removeSticker(sticker.id)}
                    className="absolute -top-3 -right-3 w-4.5 h-4.5 bg-[#ff2e54] text-white rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md select-none"
                  >
                    ×
                  </button>
                </motion.div>
              ))}

              {placedText.map((textItem) => (
                <motion.div
                  drag
                  dragConstraints={{ left: 0, right: 240, top: 0, bottom: 400 }}
                  key={textItem.id}
                  className="absolute left-[20%] top-[40%] z-20 cursor-move text-sm font-black tracking-widest text-[#00df82] uppercase bg-black/40 px-2 py-1 rounded border border-white/10 select-none text-center"
                >
                  {textItem.val}
                  <button 
                    onClick={() => setPlacedText(prev => prev.filter(t => t.id !== textItem.id))}
                    className="absolute -top-2.5 -right-2.5 w-4.5 h-4.5 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] cursor-pointer"
                  >
                    ×
                  </button>
                </motion.div>
              ))}

              {/* Watermark Logo brand overlay */}
              <div className="flex justify-between items-end z-10 pointer-events-none select-none">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black tracking-widest text-white leading-none">VIBESONIC</span>
                  <span className="text-[7px] text-gray-400 font-bold uppercase tracking-widest">viral studio</span>
                </div>
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center text-black font-black text-[9px]">
                  VS
                </div>
              </div>
            </div>

            {/* Playback Controls Footer Drawer on Screen Bezel */}
            <div className="bg-[#10141a] border-t border-white/5 p-3.5 flex justify-between items-center text-[10px] font-mono z-15 select-none shrink-0">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-primary transition-all cursor-pointer shadow"
              >
                {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
              </button>

              <div className="text-gray-400 flex items-center gap-1 max-w-[120px] truncate">
                <Sliders size={10} className="text-cyan-400 shrink-0" />
                <span>Velocidad: </span>
                <span className="font-extrabold text-white text-[11px] font-sans">{speed}x</span>
              </div>

              {/* Speed cycling toggle */}
              <button 
                onClick={() => {
                  if (speed === 0.5) setSpeed(1.0);
                  else if (speed === 1.0) setSpeed(1.5);
                  else if (speed === 1.5) setSpeed(2.0);
                  else setSpeed(0.5);
                }}
                className="bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-[9px] font-bold text-gray-300 font-sans cursor-pointer transition-colors"
              >
                Speed
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Creative Action Controls Dashboard Suite */}
        <div className="w-full md:w-[380px] bg-[#0c0f14] border-t md:border-t-0 border-white/5 overflow-y-auto flex flex-col shrink-0">

          {/* Action Tabs selector bar */}
          <div className="grid grid-cols-4 border-b border-white/5 text-center bg-black/40 text-gray-400">
            {[
              { id: 'trim', icon: <Scissors size={15} />, label: 'Corte' },
              { id: 'filter', icon: <SlidersHorizontal size={15} />, label: 'FX' },
              { id: 'music', icon: <Music size={15} />, label: 'Música' },
              { id: 'text', icon: <Type size={15} />, label: 'Cap/TXT' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 flex flex-col items-center gap-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'border-primary text-primary bg-primary/5 font-black' 
                    : 'border-transparent hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Workspaces */}
          <div className="flex-1 p-5 self-stretch space-y-6">

            {/* CUT/TRIM WORKSPACE */}
            {activeTab === 'trim' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-1">Recortar Clip de Video</h3>
                  <p className="text-[11px] text-gray-450 leading-relaxed">
                    Sincroniza el rango exacto de 15 segundos para generar tu bucle musical viral para el feed principal.
                  </p>
                </div>

                {/* Simulated Waveform Trimmer bar */}
                <div className="space-y-4">
                  <div className="relative h-14 bg-black/40 rounded-xl overflow-hidden border border-white/10 flex items-center pr-1 p-0.5">
                    
                    {/* Simulated waves blocks */}
                    <div className="absolute inset-0 flex items-center justify-around px-2 py-1 opacity-20 pointer-events-none">
                      {[30, 45, 90, 80, 50, 40, 75, 95, 100, 30, 45, 75, 90, 80, 50, 95, 70, 45, 95].map((h, i) => (
                        <div key={i} className="w-1.5 bg-white rounded-full" style={{ height: `${h}%` }} />
                      ))}
                    </div>

                    {/* Left Trim marker representation */}
                    <div 
                      className="absolute top-0 bottom-0 bg-primary/20 border-l-[3.5px] border-primary z-10 w-2.5 rounded-l flex items-center justify-center cursor-ew-resize hover:bg-primary/30 transition-all shadow-[0_0_15px_rgba(3,221,130,0.3)]"
                      style={{ left: `${trimStart}%` }}
                    />

                    {/* Selective Highlight range */}
                    <div 
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-primary/10 to-cyan-400/10 z-0 h-full border-t border-b border-primary/25"
                      style={{ left: `${trimStart}%`, right: `${100 - trimEnd}%` }}
                    />

                    {/* Playhead position preview indicator */}
                    <div 
                      className="absolute top-0 bottom-0 bg-cyan-400 w-0.5 z-10 shadow-[0_0_10px_#00cbff]"
                      style={{ left: `${trimStart + (playbackTime / (trimEnd - trimStart)) * (trimEnd - trimStart)}%` }}
                    />

                    {/* Right Trim marker representation */}
                    <div 
                      className="absolute top-0 bottom-0 bg-primary/20 border-r-[3.5px] border-primary z-10 w-2.5 rounded-r flex items-center justify-center cursor-ew-resize hover:bg-primary/30 transition-all shadow-[0_0_15px_rgba(3,221,130,0.3)]"
                      style={{ right: `${100 - trimEnd}%` }}
                    />
                  </div>

                  {/* Handles Control sliders fallback */}
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
                    <div className="space-y-1 bg-black/30 border border-white/5 p-2 rounded-xl text-left">
                      <span className="text-gray-500">MÁRGEN INICIO:</span>
                      <div className="flex justify-between items-center">
                        <input 
                          type="range" min="0" max="45" value={trimStart} 
                          onChange={(e) => setTrimStart(Number(e.target.value))}
                          className="w-full accent-primary" 
                        />
                        <span className="text-white ml-2 font-bold">{trimStart}s</span>
                      </div>
                    </div>

                    <div className="space-y-1 bg-black/30 border border-white/5 p-2 rounded-xl text-left">
                      <span className="text-gray-500">MÁRGEN FINAL:</span>
                      <div className="flex justify-between items-center">
                        <input 
                          type="range" min="55" max="100" value={trimEnd} 
                          onChange={(e) => setTrimEnd(Number(e.target.value))}
                          className="w-full accent-primary" 
                        />
                        <span className="text-white ml-2 font-bold">{trimEnd}s</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional controls: Video pace selectors */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold leading-none">Ajuste de Velocidad Pro:</span>
                  <div className="grid grid-cols-4 gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
                    {([0.5, 1.0, 1.5, 2.0] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setSpeed(r)}
                        className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                          speed === r ? 'bg-primary text-black font-extrabold' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {r}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                  <RotateCcw className="w-4.5 h-4.5 mx-auto text-cyan-400 animate-spin mb-1.5" />
                  <p className="text-[10px] text-gray-400 font-bold leading-normal">
                    ¿Te equivocaste? Los cambios se procesan en lote local para optimizar el rendimiento del celular móvil.
                  </p>
                </div>
              </div>
            )}

            {/* VISUAL FILTERS VAPORWAVE / NEON */}
            {activeTab === 'filter' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-1">Filtros y Efectos de Grado Comercial</h3>
                  <p className="text-[11px] text-gray-450 leading-relaxed">
                    Efectos atmosféricos y distorsión análoga que ajustan la vibra cromática del clip de video al instante.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {PRESET_FILTERS.map((filt) => (
                    <button
                      key={filt.id}
                      onClick={() => setActiveFilter(filt.id)}
                      className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer group ${
                        activeFilter === filt.id 
                          ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5' 
                          : 'bg-black/40 border-white/5 text-gray-450 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-tr from-[#252a34] to-black border border-white/15 overflow-hidden filter ${filt.class} flex items-center justify-center text-xs shadow-md`}>
                        ★
                      </div>
                      <span className="text-[9px] font-black group-hover:text-primary transition-colors uppercase truncate max-w-full">{filt.name}</span>
                    </button>
                  ))}
                </div>

                {/* Custom glitch parameters controls slider */}
                <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5 text-left">
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 font-bold">
                    <span>INTENSIDAD DE EFECTO FX:</span>
                    <span className="text-white font-extrabold font-mono">{glitchIntensity}%</span>
                  </div>
                  <input 
                    type="range" min="10" max="100" value={glitchIntensity} 
                    onChange={(e) => setGlitchIntensity(Number(e.target.value))}
                    className="w-full accent-primary" 
                  />
                  <div className="flex justify-between text-[8px] font-mono text-gray-500 font-bold">
                    <span>SUTIL / CLEAN</span>
                    <span>FUERTE / GLITCH VAPOR</span>
                  </div>
                </div>
              </div>
            )}

            {/* AUDIO INTEGRATION TRACKS PORT */}
            {activeTab === 'music' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#00df82] mb-1">Música y Sonido Integrado</h3>
                  <p className="text-[11px] text-gray-440 leading-relaxed">
                    Añade un fondo sónico y regula el volumen para mezclar tu propia voz grabada con pistas musicales de tendencia.
                  </p>
                </div>

                {/* Volume slider control */}
                <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-2.5 text-left">
                  <div className="flex justify-between text-[10px] font-mono text-gray-400 font-bold">
                    <span>BALANCE DE VOLUMEN DE FONDO:</span>
                    <span className="text-cyan-400 font-extrabold font-mono">{bgVolume}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Volume2 size={13} className="text-gray-400" />
                    <input 
                      type="range" min="0" max="100" value={bgVolume} 
                      onChange={(e) => setBgVolume(Number(e.target.value))}
                      className="w-full accent-primary" 
                    />
                  </div>
                </div>

                {/* Popular songs select list */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold leading-none">Navegar Pistas Virales:</span>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {isTracksLoading ? (
                      <div className="py-8 flex flex-col items-center gap-2 text-gray-650">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span className="text-[9px] font-mono">BÚSQUEDA DE PISTAS...</span>
                      </div>
                    ) : (
                      trendingTracks.map((song) => {
                        const isChosen = selectedBgTrack?.id === song.id;
                        return (
                          <div
                            key={song.id}
                            onClick={() => setSelectedBgTrack(isChosen ? null : song)}
                            className={`flex items-center gap-3 p-2 rounded-xl transition-all border cursor-pointer ${
                              isChosen 
                                ? 'bg-[#00df82]/10 border-[#00df82] text-white shadow-md' 
                                : 'bg-black/20 border-white/5 text-gray-300 hover:bg-black/40 hover:border-white/10'
                            }`}
                          >
                            <img src={song.thumbnail} alt="" className="w-8 h-8 rounded object-cover shadow" />
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-[11px] font-black leading-none truncate">{song.title}</p>
                              <p className="text-[9px] text-gray-500 truncate mt-1 leading-none">{song.artist}</p>
                            </div>
                            <div className="w-4.5 h-4.5 rounded-full border border-white/10 flex items-center justify-center">
                              {isChosen && <Check size={10} className="text-[#00df82]" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTITLES & STICKERS OVERLAYS */}
            {activeTab === 'text' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-1">Subtítulos Inteligentes y Overlays</h3>
                  <p className="text-[11px] text-gray-440 leading-relaxed">
                    Transcribe el audio hablado a texto sincronizado por inteligencia artificial, o inserta stickers y títulos decorativos neón en la pantalla.
                  </p>
                </div>

                {/* Auto subtitles buttons suite */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold leading-none">Subtitulado automático:</span>
                  <button
                    onClick={handleGenerateSubtitles}
                    disabled={isGeneratingSubs}
                    className="w-full py-3 bg-gradient-to-r from-primary/10 via-primary/20 to-cyan-400/10 hover:brightness-110 active:scale-99 border border-primary/20 hover:border-primary/40 rounded-xl text-primary font-black uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isGeneratingSubs ? (
                      <>
                        <RefreshCw size={12} className="animate-spin text-white" />
                        <span>TRANSCRÍBIENDO SEÑALES...</span>
                      </>
                    ) : autoSubtitlesEnabled ? (
                      <>
                        <Check size={12} className="text-white" />
                        <span>¡LETRA Y AUDIO SINCRONIZADOS!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} className="animate-pulse" />
                        <span>Sincronizar Audio a Texto IA</span>
                      </>
                    )}
                  </button>

                  {autoSubtitlesEnabled && (
                    <button 
                      onClick={() => setAutoSubtitlesEnabled(false)}
                      className="text-[9px] text-[#ff2e54] font-black uppercase block tracking-wider mt-1 hover:underline text-left cursor-pointer mx-auto"
                    >
                      Quitar Subtítulos
                    </button>
                  )}
                </div>

                {/* Stickers Shelf */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold leading-none">Añadir Stickers Virales (Presione para Insertar):</span>
                  <div className="grid grid-cols-5 gap-2 bg-black/20 p-2 border border-white/5 rounded-2xl">
                    {PRESET_STICKERS.map((stk) => (
                      <button
                        key={stk}
                        onClick={() => handleAddSticker(stk)}
                        className="p-1 text-2xl hover:bg-white/5 active:scale-90 transition-all rounded cursor-pointer"
                      >
                        {stk}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add dynamic manual texts fields */}
                <form onSubmit={handleAddCustomText} className="space-y-2.5 text-left">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold leading-none">Añadir Texto Estático:</span>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={editorText}
                      onChange={(e) => setEditorText(e.target.value)}
                      placeholder='Escribe un título neón...'
                      className="flex-1 bg-black/40 border border-white/15 focus:border-primary px-3 py-2 rounded-xl text-xs text-white placeholder:text-gray-650"
                    />
                    <button 
                      type="submit"
                      className="bg-[#00cbff] text-black font-black text-xs uppercase tracking-wider px-4 rounded-xl cursor-pointer hover:scale-103 active:scale-97"
                    >
                      +
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Holographic Export Loading Screen overlay modal */}
      <AnimatePresence>
        {isExporting && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-[130] p-6 text-center select-none pointer-events-auto">
            <div className="space-y-6 max-w-sm">
              
              {/* Spinner of light nodes */}
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-primary border-r-cyan-400 rounded-full animate-spin" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono font-black text-primary uppercase tracking-[0.2em]">CODIFICANDO META-MÚSICA...</span>
                <h3 className="text-xl font-black text-white">{language === 'es' ? 'Exportando Bucle de Video' : 'Loop Export in Progress'}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Mezclando frecuencias de audio, filtros visuales y stickers para optimizar el peso para la red social.
                </p>
              </div>

              {/* Progress Line */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono font-black text-white">
                  <span>PROGRESO:</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/[0.03]">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-[#00cbff]" style={{ width: `${exportProgress}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExportDone && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-[130] p-6 text-center select-none pointer-events-auto">
            <div className="bg-[#0c0f14] border border-primary/20 rounded-[32px] p-8 space-y-6 max-w-sm shadow-3xl text-left relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-tr from-primary to-cyan-400 rounded-full flex items-center justify-center border border-primary shadow-[0_0_30px_rgba(3,221,130,0.5)]">
                <Check size={32} className="text-black" />
              </div>
              
              <div className="text-center space-y-2 pt-6">
                <span className="text-[10px] font-mono font-black text-primary uppercase tracking-[0.2em]">PROCESO COMPLETADO</span>
                <h3 className="text-xl font-black text-white">{language === 'es' ? '¡Bucle de Video Listo!' : 'Broadcast Ready!'}</h3>
                <p className="text-xs text-gray-400 leading-normal">
                  El clip de video de 15 segundos ha sido codificado, sincronizado con las letras karaoke y guardado en tu biblioteca móvil. Ya puedes compartirlo en los feeds.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsExportDone(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-black uppercase border border-white/5 cursor-pointer text-center"
                >
                  {language === 'es' ? 'Editar Más' : 'Edit Info'}
                </button>
                <button
                  onClick={() => {
                    setIsExportDone(false);
                    if (onClose) onClose();
                  }}
                  className="flex-1 py-3 bg-primary text-black rounded-xl text-xs font-black uppercase text-center shadow-lg shadow-primary/20 cursor-pointer"
                >
                  {language === 'es' ? 'Publicar Ahora' : 'Publish Loop'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
