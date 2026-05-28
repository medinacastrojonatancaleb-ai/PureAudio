import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Upload, Video, Image as ImageIcon, Sparkles, Folder, ArrowLeft, 
  Play, Pause, Volume2, Check, SlidersHorizontal, Trash2, Sliders, Type, Smile, Music, Square
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { youtubeService } from '../services/youtubeService';
import { db, storage } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAppStore } from '../store/useAppStore';

import { DragElement, MusicItem } from '../components/editor/types';
import VideoPreview, { PRESET_FILTERS } from '../components/editor/VideoPreview';
import Timeline from '../components/editor/Timeline';
import MusicTrack from '../components/editor/MusicTrack';
import TextLayer from '../components/editor/TextLayer';
import TrimControls from '../components/editor/TrimControls';
import FiltersPanel from '../components/editor/FiltersPanel';
import StickersPanel from '../components/editor/StickersPanel';
import AudioControls from '../components/editor/AudioControls';
import ExportScreen from '../components/editor/ExportScreen';

// Pre-loaded high fidelity base sychronous video templates to allow immediate interaction
const PRESET_LOOPS = [
  {
    name: 'Neon Horizon Lofi',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-neon-light-on-a-wet-street-at-night-42233-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=300&q=80',
    type: 'video'
  },
  {
    name: 'VJ Concert Pulsar',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-laser-lights-at-a-music-concert-42111-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80',
    type: 'video'
  },
  {
    name: 'Synthwave Driving',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    thumb: 'https://images.unsplash.com/photo-1515462277126-270d878326e5?auto=format&fit=crop&w=300&q=80',
    type: 'video'
  },
  {
    name: 'Cassette Chill Image',
    url: 'https://images.unsplash.com/photo-1543536448-d209d2d13a1c?auto=format&fit=crop&w=600&q=80',
    thumb: 'https://images.unsplash.com/photo-1543536448-d209d2d13a1c?auto=format&fit=crop&w=300&q=80',
    type: 'image'
  }
];

const AUTOSUBTITLES_COOP = [
  { text: "🎵 ESTA VIBRA SE ME PEGA AL CORAZÓN 🎵", start: 0.0, end: 3.5 },
  { text: "⚡ PureAudio Sintoniza en mi mente ⚡", start: 4.0, end: 7.5 },
  { text: "🌵 Buscando horizontes de serenidad 🌵", start: 8.0, end: 11.5 },
  { text: "🎧 Conectando frecuencias intergalácticas 🎧", start: 12.0, end: 15.0 }
];

interface CreatePostScreenProps {
  onNavigateBack?: () => void;
}

export default function CreatePostScreen({ onNavigateBack }: CreatePostScreenProps) {
  const { user, notify, language, addPost } = usePlayer();
  const { soundtrackToUse, setSoundtrackToUse } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Flow State
  const [currentStep, setCurrentStep] = useState<'pre-editor' | 'editor'>('pre-editor');
  
  // Editor Master States
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaFileType, setMediaFileType] = useState<'image' | 'video'>('video');
  const [projectIdName, setProjectIdName] = useState('Nuevo Proyecto Loops');

  // Playback Control
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const [speed, setSpeed] = useState<number>(1.0);
  
  // Trimming State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(15);

  // Sound Integration
  const [musicTrack, setMusicTrack] = useState<MusicItem | null>(null);
  const [originalVolume, setOriginalVolume] = useState(100);
  const [soundtrackVolume, setSoundtrackVolume] = useState(80);
  const [fadeIn, setFadeIn] = useState(1.0);
  const [fadeOut, setFadeOut] = useState(1.0);
  const [isVolumeMuted, setIsVolumeMuted] = useState(false);

  // Color grading filters
  const [activeFilter, setActiveFilter] = useState('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Drag elements (texts & stickers overlays)
  const [elements, setElements] = useState<DragElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | number | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<'video' | 'text' | 'music' | 'sticker' | null>(null);

  // Active Bottom Sheet Tab
  const [activeTab, setActiveTab] = useState<'trim' | 'filter' | 'music' | 'text' | 'stickers' | 'audio'>('trim');

  // Karaoke Subtitle Generation
  const [autoSubtitlesEnabled, setAutoSubtitlesEnabled] = useState(true);

  // Export & Compilation Simulation
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExportDone, setIsExportDone] = useState(false);

  // Auto load layout music selected from feed using "Usar Sonido"
  useEffect(() => {
    if (soundtrackToUse) {
      setMusicTrack({
        id: soundtrackToUse.id,
        title: soundtrackToUse.title,
        artist: soundtrackToUse.artist,
        thumbnail: soundtrackToUse.thumbnail,
        volume: 80,
        trimStart: 0,
        trimEnd: 15,
        fadeIn: 1.0,
        fadeOut: 1.0
      });
      setSoundtrackToUse(null);
      setActiveTab('music');
      notify(language === 'es' ? '¡Música cargada automáticamente!' : 'Soundtrack preloaded successfully!', 'success');
    }
  }, [soundtrackToUse, setSoundtrackToUse, language, notify]);

  // Sync Loop playback conditions
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video) {
        const vTime = video.currentTime;
        setCurrentTime(vTime);

        // Custom bounds looping criteria
        if (vTime >= trimEnd || vTime < trimStart) {
          video.currentTime = trimStart;
          setCurrentTime(trimStart);
        }
      } else {
        // Fallback timing for static backgrounds
        setCurrentTime(prev => {
          const delta = 0.1 * speed;
          const next = prev + delta;
          if (next >= trimEnd) {
            return trimStart;
          }
          return next;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, trimStart, trimEnd, speed]);

  // File loading hook
  const processFile = useCallback((file: File) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      notify(
        language === 'es' ? 'Solo puedes subir imágenes o videos válidos' : 'Only valid images or videos are allowed',
        'info'
      );
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setMediaUrl(objectUrl);
    setSelectedFile(file);
    setMediaFileType(isImage ? 'image' : 'video');
    setProjectIdName(file.name.split('.')[0] || 'Mi Video Loop');
    
    // Automatically transition to advanced editor!
    setCurrentStep('editor');
    notify(language === 'es' ? 'Contenido importado con éxito' : 'Content imported successfully!', 'success');
  }, [language, notify]);

  const choosePresetLoop = (url: string, name: string, type: 'video' | 'image') => {
    setMediaUrl(url);
    setSelectedFile(null); // Loaded from preset
    setMediaFileType(type);
    setProjectIdName(name);

    setCurrentStep('editor');
    notify(language === 'es' ? `Cargando loop de plantilla: ${name}` : `Loading loop template: ${name}`, 'success');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Drag and Drop coordinate insertion methods
  const handleAddTextElement = (config: { text: string; color: string; animation: any; fontFamily: string }) => {
    const newEl: DragElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      text: config.text,
      color: config.color,
      animation: config.animation,
      fontFamily: config.fontFamily,
      x: 50,
      y: 35,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0
    };
    setElements(prev => [...prev, newEl]);
    setSelectedElementId(newEl.id);
    setSelectedElementType('text');
  };

  const handleAddStickerElement = (symbol: string) => {
    const newEl: DragElement = {
      id: `sticker_${Date.now()}`,
      type: 'sticker',
      symbol,
      x: 50,
      y: 50,
      scale: 1.2,
      rotation: 0,
      opacity: 1.0
    };
    setElements(prev => [...prev, newEl]);
    setSelectedElementId(newEl.id);
    setSelectedElementType('sticker');
  };

  const handleUpdateElement = (id: string | number, updates: Partial<DragElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const handleRemoveElement = (id: string | number) => {
    setElements(prev => prev.filter(el => el.id !== id));
  };

  // Auto layout focus based on highlight triggers
  const handleSelectElement = (id: string | number | null, type: any) => {
    setSelectedElementId(id);
    setSelectedElementType(type);

    // Switch active bottom tools contextually like CapCut!
    if (type === 'text') setActiveTab('text');
    if (type === 'sticker') setActiveTab('stickers');
    if (type === 'music') setActiveTab('audio');
    if (type === 'video') setActiveTab('trim');
  };

  // Visual Adjustment Change Handler
  const handleChangeAdjustments = (type: 'brightness' | 'contrast' | 'saturation', value: number) => {
    if (type === 'brightness') setBrightness(value);
    if (type === 'contrast') setContrast(value);
    if (type === 'saturation') setSaturation(value);
  };

  // Audio Control settings triggers
  const handleAddMusic = (track: MusicItem) => {
    setMusicTrack(track);
    setSelectedElementId('music_track');
    setSelectedElementType('music');
    setActiveTab('audio');
    notify(language === 'es' ? 'Banda sonora añadida al timeline' : 'Soundtrack loaded in bottom lane', 'success');
  };

  const handleRemoveMusic = () => {
    setMusicTrack(null);
    setSelectedElementId(null);
    setSelectedElementType(null);
    notify(language === 'es' ? 'Banda sonora removida' : 'Soundtrack removed', 'info');
  };

  // Karaoke Subtitle Resolver
  const currentSubtitleString = () => {
    if (!autoSubtitlesEnabled) return null;
    const block = AUTOSUBTITLES_COOP.find(b => currentTime >= b.start && currentTime <= b.end);
    return block ? block.text : null;
  };

  // Export and compiling flows
  const triggerExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    setIsExportDone(false);

    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setIsExportDone(true);
          return 100;
        }
        return prev + Math.floor(Math.random() * 8 + 6);
      });
    }, 240);
  };

  const handlePublishNow = async () => {
    setIsExportDone(false);
    notify(
      language === 'es' ? 'Iniciando conexión con Firebase Storage...' : 'Establishing link with Firebase Storage...',
      'progress'
    );

    try {
      let finalFileUrl = mediaUrl;

      // If user uploaded a real physical file, push to Firebase Storage!
      if (selectedFile) {
        const fileRef = ref(storage, `users/${user?.uid || 'guest'}/posts/${Date.now()}_${selectedFile.name}`);
        const result = await uploadBytes(fileRef, selectedFile);
        finalFileUrl = await getDownloadURL(result.ref);
      }

      // Compile captions hashtags and metadata payload
      const postText = `Bucle musical compilado: ${projectIdName}! 🚀🎙️ #pureaudio #cyberpunk #aesthetic`;
      const postPayload: any = {
        userId: user?.uid || 'guest_user',
        user: user?.displayName || 'Tú 🎧',
        avatar: user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        caption: postText,
        imageUrl: mediaFileType === 'image' ? finalFileUrl : '',
        image: mediaFileType === 'image' ? finalFileUrl : '',
        videoUrl: mediaFileType === 'video' ? finalFileUrl : '',
        songTitle: musicTrack ? musicTrack.title : 'Sonido Original',
        artist: musicTrack ? musicTrack.artist : 'Creador',
        coverUrl: musicTrack ? musicTrack.thumbnail : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=150&q=80',
        likes: 12,
        comments: 1,
        createdAt: new Date().toISOString()
      };

      if (musicTrack) {
        postPayload.music = {
          id: musicTrack.id,
          title: musicTrack.title,
          artist: musicTrack.artist,
          thumbnail: musicTrack.thumbnail
        };
      }

      // Upload to Firestore posts_social collection
      try {
        await addDoc(collection(db, 'posts_social'), postPayload);
      } catch (err) {
        console.warn('Firestore integration bypassed. Refreshing feed locally...', err);
      }

      // Sync React state feeds context instantly so they show up beautifully!
      addPost(
        postText,
        mediaFileType === 'image' ? finalFileUrl : undefined,
        musicTrack ? {
          id: musicTrack.id,
          title: musicTrack.title,
          artist: musicTrack.artist,
          thumbnail: musicTrack.thumbnail
        } : undefined,
        mediaFileType === 'video' ? finalFileUrl : undefined
      );

      notify(
        language === 'es' ? '¡Loop publicado en tu Feed!' : 'Post shared on the feed!',
        'success'
      );

      // Close editor and navigate back
      if (onNavigateBack) {
        onNavigateBack();
      }
    } catch (e: any) {
      console.error('Publishing failed:', e);
      notify(e.message, 'info');
    }
  };

  // Exit editor safely cleaning memory object URLs
  const handleExitEditor = () => {
    if (selectedFile && mediaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl('');
    setSelectedFile(null);
    setElements([]);
    setCurrentStep('pre-editor');
  };

  return (
    <div className="flex-grow w-full h-full text-[#E4E6EB] bg-[#0B0B0F] overflow-hidden select-none select-none flex flex-col relative">
      
      {/* 
        ========================================================================
        STEP 2: SIMPLE "NUEVO PROYECTO" INITIAL WORKSPACE (CapCut Layout)
        ========================================================================
      */}
      {currentStep === 'pre-editor' && (
        <div id="new_project_screen" className="flex-1 overflow-y-auto scrollbar-hide px-4 py-8 max-w-xl mx-auto w-full flex flex-col justify-center space-y-8">
          
          <div className="text-center space-y-1.5 pt-6">
            <h2 className="text-2xl font-black italic tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-[#7C4DFF] via-purple-300 to-cyan-400">
              PUREAUDIO STUDIO
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] font-mono block">
              Pro CapCut-styled Video Loop Builder
            </p>
          </div>

          {/* Simple Clean Glowing Central Card (CapCut Inspired) */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer bg-[#16161D] rounded-[32px] p-10 border-2 border-dashed border-white/10 hover:border-[#7C4DFF]/30 hover:shadow-[0_0_30px_rgba(124,77,255,0.15)] transition-all flex flex-col items-center justify-center text-center space-y-4"
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
              accept="video/*,image/*"
              className="hidden"
            />
            
            {/* Glowing Icon center */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#7C4DFF] to-cyan-400 flex items-center justify-center text-black border border-[#7C4DFF] hover:scale-105 transition-transform shadow-[0_0_30px_rgba(124,77,255,0.35)]">
              <Plus size={36} className="text-black stroke-[3px]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-white uppercase tracking-tight">NUEVO PROYECTO</h3>
              <p className="text-xs text-gray-400 leading-normal max-w-xs mx-auto">
                {language === 'es' 
                  ? 'Haz clic o arrastra un archivo de video o fotografía real para montar el editor sónico'
                  : 'Click or drag a physical video or photo file to bootstrap the sonic loop workstation'
                }
              </p>
            </div>
            
            <div className="flex gap-4 pt-2 text-[10px] font-black uppercase text-gray-500 font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400 bg-cyan-450/5 px-3 py-1.5 rounded-full border border-cyan-400/10">
                <Video size={11} /> VIDEO
              </span>
              <span className="flex items-center gap-1.5 text-primary bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
                <ImageIcon size={11} /> IMAGEN
              </span>
            </div>
          </div>

          {/* Preloaded Template loop section */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-gray-550 uppercase tracking-widest block font-bold text-left leading-none">
              O USAR UNA PLANTILLA PUREAUDIO:
            </span>

            <div className="grid grid-cols-2 gap-3">
              {PRESET_LOOPS.map((loop, idx) => (
                <div 
                  key={idx}
                  onClick={() => choosePresetLoop(loop.url, loop.name, loop.type as any)}
                  className="group relative h-28 rounded-2xl overflow-hidden border border-white/5 cursor-pointer bg-[#16161D] flex flex-col justify-end p-3 hover:border-primary/30 transition-all select-none"
                >
                  <img src={loop.thumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F]/90 via-transparent to-transparent" />
                  
                  {/* Title overlay */}
                  <div className="z-10 text-left">
                    <span className="text-[9.5px] font-black uppercase block text-white truncate leading-none">
                      {loop.name}
                    </span>
                    <span className="text-[8px] text-[#A0A0B8] font-bold block mt-1 uppercase leading-none font-mono">
                      {loop.type === 'video' ? '🎬 VIDEO LOOP' : '🖼️ CHILL BACKGROUND'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        STEP 3: ADVANCED CAPCUT MULTI-TRACK INTERACTIVE EDITOR
        ========================================================================
      */}
      {currentStep === 'editor' && (
        <div id="advanced_capcut_workspace" className="flex-grow flex flex-col overflow-hidden h-full">
          
          {/* Header Bar */}
          <header className="h-[52px] border-b border-[#252830] bg-[#12141C] px-4 flex items-center justify-between shrink-0">
            {/* Left section: Back and filename */}
            <div className="flex items-center gap-4 text-left">
              <button 
                onClick={handleExitEditor}
                className="p-1.5 bg-[#252830]/80 hover:bg-[#323644] text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Salir del editor"
              >
                <ArrowLeft size={15} />
              </button>
              
              <div className="h-4 w-px bg-white/10" />

              <div>
                <span className="text-[8px] font-mono text-gray-500 font-bold uppercase block leading-none">CAPCUT ESTILO</span>
                <input 
                  type="text"
                  value={projectIdName}
                  onChange={(e) => setProjectIdName(e.target.value)}
                  className="bg-transparent border-0 font-black text-white text-[12.5px] focus:bg-[#252830] rounded px-1.5 py-0.5 outline-none font-sans"
                />
              </div>
            </div>

            {/* Title / Watermark Banner */}
            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-[#7C4DFF] tracking-widest uppercase">
              <Sparkles size={11} className="animate-spin text-white" />
              <span>DISEÑO OSCURO ULTRA-PREMIUM</span>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Reset Canvas */}
              <button 
                onClick={() => {
                  setElements([]);
                  notify(language === 'es' ? 'Lienzo restaurado' : 'Canvas reset', 'info');
                }}
                className="p-2 bg-[#252830] hover:bg-[#323644] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer text-xs font-black uppercase tracking-tight flex items-center gap-1"
                title="Limpiar"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Limpiar</span>
              </button>

              {/* Blue Export Button */}
              <button 
                onClick={triggerExport}
                className="bg-[#7C4DFF] hover:bg-[#8C5DFF] active:scale-95 text-black font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-[#7C4DFF]/15 cursor-pointer transition-all border border-[#7C4DFF]/25"
              >
                <Upload size={13} className="text-black stroke-[3px]" />
                <span>Exportar</span>
              </button>
            </div>
          </header>

          {/* Main workspace layout: Split into Canvas and Right Sidebar */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            
            {/* Center Area: Preview Canvas */}
            <div className="flex-1 relative overflow-hidden bg-[#0A0B0E] max-h-[48vh] md:max-h-none flex flex-col">
              <VideoPreview 
                mediaUrl={mediaUrl}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                videoRef={videoRef}
                elements={elements}
                onUpdateElement={handleUpdateElement}
                onRemoveElement={handleRemoveElement}
                selectedElementId={selectedElementId}
                onSelectElement={handleSelectElement}
                activeFilter={activeFilter}
                brightness={brightness}
                contrast={contrast}
                saturation={saturation}
                karaokeSubtitle={currentSubtitleString()}
                isVolumeMuted={isVolumeMuted}
              />

              {/* In-Preview Playback Control bar */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#12141C]/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-4 border border-white/5 shadow-2xl z-25 shrink-0 select-none">
                <button 
                  onClick={() => {
                    const video = videoRef.current;
                    if (isPlaying) {
                      // Terminar (Stop & Reset to start)
                      setIsPlaying(false);
                      if (video) {
                        video.currentTime = trimStart;
                      }
                      setCurrentTime(trimStart);
                    } else {
                      // Iniciar / Volver a Iniciar (Rewind & Start)
                      if (video) {
                        video.currentTime = trimStart;
                      }
                      setCurrentTime(trimStart);
                      setIsPlaying(true);
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-[#7C4DFF] hover:scale-110 active:scale-95 flex items-center justify-center text-black shadow-lg shadow-[#7C4DFF]/20 transition-all cursor-pointer"
                  title={isPlaying ? "Terminar" : "Iniciar / Volver a Iniciar"}
                >
                  {isPlaying ? (
                    <Square size={13} fill="currentColor" stroke="none" className="text-black" />
                  ) : (
                    <Play size={14} fill="currentColor" className="ml-0.5 text-black" stroke="none" />
                  )}
                </button>
                
                <div className="h-4 w-px bg-white/10" />

                <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                  <span>VELOCIDAD:</span>
                  <span className="text-white font-black font-sans bg-[#252830] px-1.5 py-0.5 rounded leading-none">{speed}x</span>
                </div>
              </div>
            </div>

            {/* Right Workspace: Context Tab Control panels */}
            <div className="w-full md:w-[350px] lg:w-[380px] bg-[#12141C] border-t md:border-t-0 md:border-l border-[#252830] flex flex-col overflow-hidden shrink-0">
              
              {/* Category selector row (CapCut slider row) */}
              <div className="flex overflow-x-auto border-b border-[#252830] bg-[#0A0B0E]/60 scrollbar-hide shrink-0 text-center text-gray-500 font-sans">
                {[
                  { id: 'trim', label: 'Corte', icon: <Sliders size={12} /> },
                  { id: 'filter', label: 'Filtros', icon: <SlidersHorizontal size={12} /> },
                  { id: 'music', label: 'Música', icon: <Music size={12} /> },
                  { id: 'text', label: 'Texto', icon: <Type size={12} /> },
                  { id: 'stickers', label: 'Stickers', icon: <Smile size={12} /> },
                  { id: 'audio', label: 'Audio', icon: <Volume2 size={12} /> }
                ].map((tb) => {
                  const isActive = activeTab === tb.id;
                  return (
                    <button
                      key={tb.id}
                      onClick={() => setActiveTab(tb.id as any)}
                      className={`flex-1 py-3 px-3 flex flex-col items-center gap-1 text-[9.5px] uppercase font-bold tracking-wider cursor-pointer border-b-2 transition-all shrink-0 ${
                        isActive 
                          ? 'border-[#7C4DFF] text-[#7C4DFF] bg-[#7C4DFF]/5 font-black' 
                          : 'border-transparent hover:text-white'
                      }`}
                    >
                      {tb.icon}
                      <span>{tb.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic scrollable subpanel dependant on active tab */}
              <div className="flex-1 p-5 overflow-y-auto scrollbar-thin self-stretch">
                
                {/* 1. TRIM SUBPANEL */}
                {activeTab === 'trim' && (
                  <TrimControls 
                    trimStart={trimStart}
                    trimEnd={trimEnd}
                    duration={duration}
                    onUpdateTrim={(st, ed) => {
                      setTrimStart(st);
                      setTrimEnd(ed);
                    }}
                    speed={speed}
                    onChangeSpeed={setSpeed}
                  />
                )}

                {/* 2. FILTERS SUBPANEL */}
                {activeTab === 'filter' && (
                  <FiltersPanel 
                    activeFilter={activeFilter}
                    onChangeFilter={setActiveFilter}
                    brightness={brightness}
                    contrast={contrast}
                    saturation={saturation}
                    onChangeAdjustments={handleChangeAdjustments}
                  />
                )}

                {/* 3. MUSIC SUBPANEL */}
                {activeTab === 'music' && (
                  <MusicTrack 
                    onAddMusic={handleAddMusic}
                    activeMusic={musicTrack}
                    onRemoveMusic={handleRemoveMusic}
                  />
                )}

                {/* 4. TEXT SUBPANEL */}
                {activeTab === 'text' && (
                  <TextLayer 
                    onAddText={handleAddTextElement}
                    selectedTextElement={elements.find(el => el.id === selectedElementId && el.type === 'text') || null}
                    onUpdateElement={handleUpdateElement}
                  />
                )}

                {/* 5. STICKERS SUBPANEL */}
                {activeTab === 'stickers' && (
                  <StickersPanel 
                    onAddSticker={handleAddStickerElement}
                    selectedStickerElement={elements.find(el => el.id === selectedElementId && el.type === 'sticker') || null}
                    onUpdateElement={handleUpdateElement}
                  />
                )}

                {/* 6. AUDIO BALANCE SUBPANEL */}
                {activeTab === 'audio' && (
                  <AudioControls 
                    originalVolume={originalVolume}
                    soundtrackVolume={soundtrackVolume}
                    fadeIn={fadeIn}
                    fadeOut={fadeOut}
                    onChangeOriginalVolume={setOriginalVolume}
                    onChangeSoundtrackVolume={setSoundtrackVolume}
                    onChangeFadeIn={setFadeIn}
                    onChangeFadeOut={setFadeOut}
                    isMuted={isVolumeMuted}
                    onToggleMute={() => setIsVolumeMuted(!isVolumeMuted)}
                  />
                )}

              </div>
            </div>
          </div>

          {/* Interactive Multitrack Grid Timeline panel */}
          <Timeline 
            currentTime={currentTime}
            duration={duration}
            elements={elements}
            onSelectElement={handleSelectElement}
            selectedElementId={selectedElementId}
            musicTrack={musicTrack}
            activeFilter={activeFilter}
            onScrub={(time) => {
              setCurrentTime(time);
              if (videoRef.current) {
                videoRef.current.currentTime = time;
              }
            }}
            mediaUrl={mediaUrl}
          />

          {/* Export progress & done dialog */}
          <ExportScreen 
            isExporting={isExporting}
            exportProgress={exportProgress}
            isExportDone={isExportDone}
            onCloseExport={() => setIsExportDone(false)}
            onPublish={handlePublishNow}
            projectName={projectIdName}
          />

        </div>
      )}
    </div>
  );
}
