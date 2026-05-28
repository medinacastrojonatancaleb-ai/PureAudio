import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, Sliders, Music, Type, Sparkles, Play, Pause, Check, 
  RotateCcw, SlidersHorizontal, Smile, Video, ArrowLeft, Volume2, 
  RefreshCw, Upload, Trash2, Heart, Plus, Search, Tag, Film, Camera, 
  Image as ImageIcon, Undo2, Redo2, HelpCircle, LayoutGrid, Monitor, 
  Smartphone, ChevronDown, Keyboard, Mic, Maximize2, Minimize2, 
  Magnet, Grip, Copy, FolderGit2, Sparkle, LogIn
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { youtubeService, YouTubeTrack } from '../services/youtubeService';
import { db, storage } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAppStore } from '../store/useAppStore';

// Preset filters grading options
interface VideoFilter {
  id: string;
  name: string;
  cssClass: string;
  glow: string;
}

interface CaptionSnippet {
  text: string;
  start: number;
  end: number;
}

const PRESET_FILTERS: VideoFilter[] = [
  { id: 'none', name: 'Original', cssClass: 'filter-none', glow: '' },
  { id: 'cyberpunk', name: 'Ambient Cyberpunk', cssClass: 'hue-rotate-15 saturate-200 contrast-125 sepia-15 brightness-95', glow: 'shadow-[#7C4DFF]/50' },
  { id: 'vaporwave', name: 'Vaporwave Dream', cssClass: 'hue-rotate-180 saturate-150 brightness-110 sepia-10', glow: 'shadow-[#00cbff]/50' },
  { id: 'vhs', name: 'Vintage VHS Tape', cssClass: 'contrast-110 saturate-75 brightness-90 grayscale-[10%] sepia-[15%]', glow: 'shadow-[#00df82]/50' },
  { id: 'golden', name: 'Golden Hour Glow', cssClass: 'sepia contrast-95 saturate-125 brightness-105', glow: 'shadow-yellow-500/50' },
  { id: 'noir', name: 'Mono Film Noir', cssClass: 'grayscale contrast-150 brightness-85 saturate-0', glow: 'shadow-white/20' }
];

const PRESET_STICKERS = ['🔥', '🎵', '⚡', '🎧', '👾', '🌈', '👑', '✨', '🎸', '🌟', '💔', '👽', '💀', '💖', '🍿', '💿'];

const SAMPLE_LOOPS = [
  {
    name: "202605241616.mp4",
    durationText: "00:53",
    url: "https://assets.mixkit.co/videos/preview/mixkit-retro-futuristic-music-visualizer-with-a-cassette-43015-large.mp4",
    thumb: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=300&q=80"
  },
  {
    name: "YTDown_Shorts_QV.mp4",
    durationText: "00:58",
    url: "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-alone-in-a-nightclub-spinning-lights-42517-large.mp4",
    thumb: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&w=300&q=80"
  },
  {
    name: "202605221022.mp4",
    durationText: "00:10",
    url: "https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-cassette-player-close-up-43033-large.mp4",
    thumb: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80"
  },
  {
    name: "YTDown_YouTube_Loop.mp4",
    durationText: "11:35",
    url: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-dj-controlling-a-sound-mixer-at-a-party-41620-large.mp4",
    thumb: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80"
  }
];

export default function CreatePostEditorScreen({ onNavigateBack }: { onNavigateBack?: () => void }) {
  const { user, notify, language, addPost } = usePlayer();
  const { soundtrackToUse, setSoundtrackToUse } = useAppStore();

  // Screen level stages: 'import' or 'edit'
  const [editorStage, setEditorStage] = useState<'import' | 'edit'>('edit'); // Defaulting to edit stage to show the powerful work canvas directly!

  // Media references & loaded states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>(SAMPLE_LOOPS[0].url); // preseeded loop
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [projectIdName, setProjectIdName] = useState<string>('202605251358');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [isRelacionDropdownOpen, setIsRelacionDropdownOpen] = useState(false);

  // Undo/Redo Simulated History
  const [historyPointer, setHistoryPointer] = useState<number>(0);
  const [undoHistory, setUndoHistory] = useState<string[]>(['Clean Template']);

  // Active Tool panel
  const [sidebarTab, setSidebarTab] = useState<'multimedia' | 'plantillas' | 'elementos' | 'audio' | 'texto' | 'subtitulos' | 'transcripcion' | 'efectos'>('multimedia');

  // Preview video control references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Playback dynamics
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackProgress, setPlaybackProgress] = useState(15); // Percentage index offset
  const [speed, setSpeed] = useState<0.5 | 1.0 | 1.5 | 2.0>(1.0);
  const [originalVolume, setOriginalVolume] = useState(80);
  const [bgVolume, setBgVolume] = useState(70);

  // Clip limits
  const [trimStart, setTrimStart] = useState(0); 
  const [trimEnd, setTrimEnd] = useState(100); 
  const [totalClipDuration, setTotalClipDuration] = useState(15.0); 

  // Workspace configuration parameters
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const [filterBrightness, setFilterBrightness] = useState(100);
  const [filterSaturation, setFilterSaturation] = useState(100);

  // Audio mix references
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [musicResults, setMusicResults] = useState<YouTubeTrack[]>([]);
  const [musicLoading, setMusicLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<YouTubeTrack | null>(null);

  // Captions synthesis
  const [autoSubtitlesEnabled, setAutoSubtitlesEnabled] = useState(false);
  const [isGeneratingSubs, setIsGeneratingSubs] = useState(false);
  const [autoSubtitlesText, setAutoSubtitlesText] = useState<CaptionSnippet[]>([]);

  // Draggable graphic decorators
  const [placedStickers, setPlacedStickers] = useState<{ id: number; symbol: string; x: number; y: number }[]>([]);
  const [addedText, setAddedText] = useState('');
  const [placedTexts, setPlacedTexts] = useState<{ id: number; text: string; color: string; scale: number; x: number; y: number }[]>([]);

  // Publisher thread controls
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExportDone, setIsExportDone] = useState(false);
  const [postCaption, setPostCaption] = useState('Creado en CapCut Studio... 🎬⚡ #PureAudio #ViralStudio');

  // Voice recording mock state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSecs, setVoiceSecs] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger history tracking logger
  const addSystemHistoryAction = (actionTitle: string) => {
    setUndoHistory(prev => [...prev.slice(0, historyPointer + 1), actionTitle]);
    setHistoryPointer(prev => prev + 1);
  };

  // Preload sound selected from live feed
  useEffect(() => {
    if (soundtrackToUse) {
      setSelectedTrack({
        id: soundtrackToUse.id,
        title: soundtrackToUse.title,
        artist: soundtrackToUse.artist,
        thumbnail: soundtrackToUse.thumbnail
      });
      setSoundtrackToUse(null);
      setMediaUrl(SAMPLE_LOOPS[0].url);
      setMediaType('video');
      setSidebarTab('multi_player' as any || 'audio');
      notify(language === 'es' ? 'Se acopló el sonido seleccionado para el render' : 'Selected track coupled to composition deck', 'success');
      addSystemHistoryAction(`Sound Coupled: ${soundtrackToUse.title}`);
    }
  }, [soundtrackToUse, setSoundtrackToUse]);

  // Simulated video run loop play tracker
  useEffect(() => {
    if (!isPlaying) return;
    const tick = setInterval(() => {
      setPlaybackProgress(prev => {
        const delta = (0.5 * speed);
        const next = prev + delta;
        if (next >= trimEnd) {
          if (videoRef.current) {
            const duration = videoRef.current.duration || totalClipDuration;
            videoRef.current.currentTime = (trimStart / 100) * duration;
          }
          return trimStart;
        }
        return next;
      });
    }, 55);
    return () => clearInterval(tick);
  }, [isPlaying, speed, trimStart, trimEnd, totalClipDuration]);

  // Synchronize dynamic preview audio element if soundtrack chosen
  useEffect(() => {
    if (!audioPreviewRef.current) return;
    if (isPlaying && selectedTrack) {
      audioPreviewRef.current.play().catch(() => {});
    } else {
      audioPreviewRef.current.pause();
    }
  }, [isPlaying, selectedTrack]);

  // Query background soundtrack catalog indexing
  useEffect(() => {
    if (!musicSearchQuery.trim()) {
      setMusicResults([]);
      return;
    }
    setMusicLoading(true);
    const debounce = setTimeout(async () => {
      try {
        const res = await youtubeService.search(musicSearchQuery);
        setMusicResults(res || []);
      } catch (err) {
        console.warn("YouTube search timeout:", err);
      } finally {
        setMusicLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounce);
  }, [musicSearchQuery]);

  // Local File imports
  const onFileLoad = useCallback((file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      notify(
        language === 'es' ? 'Solo puedes procesar imágenes o videos de formato real' : 'Only layout actual image or video media files can be edited',
        'info'
      );
      return;
    }

    setSelectedFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    
    // Revoke old object URL for memory leak hygiene
    if (mediaUrl && !mediaUrl.startsWith('http')) {
      URL.revokeObjectURL(mediaUrl);
    }

    const localBlob = URL.createObjectURL(file);
    setMediaUrl(localBlob);
    addSystemHistoryAction(`Import File: ${file.name}`);
    notify(language === 'es' ? '¡Archivo multimedia cargado con éxito!' : 'Media file loaded correctly!', 'success');
  }, [mediaUrl, language, notify]);

  // Template select triggers
  const choosePresetLoop = (url: string, name: string) => {
    setMediaType('video');
    setMediaUrl(url);
    setSelectedFile(null);
    addSystemHistoryAction(`Template: ${name}`);
    notify(language === 'es' ? 'Bucle de plantilla cargado en lienzo' : 'Visual template loaded onto canvas', 'success');
  };

  // AI voice subtitle transcriptions
  const generateAILyricsKaraoke = () => {
    setIsGeneratingSubs(true);
    notify(language === 'es' ? 'Iniciando decodificador de voz por IA...' : 'Starting AI voice synthesizer...', 'info');
    setTimeout(() => {
      setIsGeneratingSubs(false);
      setAutoSubtitlesText([
        { text: "⭐ UN RECORRIDO POR EL UNIVERSO SÓNICO ⭐", start: 0, end: 25 },
        { text: "🔥 ¡ESTÁ SENSACIÓN ESTÁ AL MÁXIMO NIVEL! 🔥", start: 30, end: 65 },
        { text: "⚡ PUREAUDIO • COMPOSITOR PREMIUM 9:16 ⚡", start: 70, end: 100 }
      ]);
      setAutoSubtitlesEnabled(true);
      addSystemHistoryAction(`AI Subtitles Transcribed`);
      notify(language === 'es' ? 'Subtítulos generados y sincronizados por IA' : 'AI Speech Karaoke lyrics synthesized', 'success');
    }, 2000);
  };

  // Adds stickers decorator layers
  const addStickerSymbol = (symbol: string) => {
    setPlacedStickers(prev => [
      ...prev,
      {
        id: Date.now(),
        symbol,
        x: Math.random() * 40 + 30,
        y: Math.random() * 40 + 20
      }
    ]);
    addSystemHistoryAction(`Add sticker: ${symbol}`);
  };

  // Adds neon text layers
  const addCustomStaticLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addedText.trim()) return;
    setPlacedTexts(prev => [
      ...prev,
      {
        id: Date.now(),
        text: addedText.trim(),
        color: '#00df82',
        scale: 1.0,
        x: Math.random() * 30 + 35,
        y: Math.random() * 30 + 30
      }
    ]);
    addSystemHistoryAction(`Add text: ${addedText.trim()}`);
    setAddedText('');
  };

  const removeSticker = (id: number) => {
    setPlacedStickers(prev => prev.filter(s => s.id !== id));
  };

  const removeText = (id: number) => {
    setPlacedTexts(prev => prev.filter(t => t.id !== id));
  };

  // Undo / Redo triggers
  const triggerUndo = () => {
    if (historyPointer > 0) {
      setHistoryPointer(prev => prev - 1);
      notify(language === 'es' ? `Deshacer: ${undoHistory[historyPointer]}` : `Undone: ${undoHistory[historyPointer]}`, 'info');
    } else {
      notify(language === 'es' ? 'Límite de historial alcanzado' : 'Beginning of history state', 'info');
    }
  };

  const triggerRedo = () => {
    if (historyPointer < undoHistory.length - 1) {
      setHistoryPointer(prev => prev + 1);
      notify(language === 'es' ? `Rehacer: ${undoHistory[historyPointer + 1]}` : `Redone: ${undoHistory[historyPointer + 1]}`, 'info');
    } else {
      notify(language === 'es' ? 'Nada más que rehacer' : 'Nothing to redo', 'info');
    }
  };

  // Clean whole canvas
  const handleClearProject = () => {
    setPlacedStickers([]);
    setPlacedTexts([]);
    setAutoSubtitlesEnabled(false);
    setSelectedTrack(null);
    setActiveFilter('none');
    setFilterBrightness(100);
    setFilterSaturation(100);
    notify(language === 'es' ? 'Proyecto limpiado correctamente' : 'Project reset cleared out', 'success');
    addSystemHistoryAction(`Clean workspace`);
  };

  // Timeline scrub click handler
  const handleTimelineScrub = (clickXPercentage: number) => {
    let pct = Math.max(0, Math.min(100, clickXPercentage));
    setPlaybackProgress(pct);
    if (videoRef.current) {
      const duration = videoRef.current.duration || totalClipDuration;
      videoRef.current.currentTime = (pct / 100) * duration;
    }
  };

  // Render compilation publish trigger
  const publishToLiveFeed = async () => {
    setIsExporting(true);
    setExportProgress(10);
    setIsExportDone(false);

    // Mock timeline frame baking compilation
    const runBakingTasks = async () => {
      await new Promise(res => setTimeout(res, 500));
      setExportProgress(35); // Applying atmospheric color matrix
      await new Promise(res => setTimeout(res, 600));
      setExportProgress(65); // Splicing 9:16 aspect ratio segments
      await new Promise(res => setTimeout(res, 500));
      setExportProgress(85); // Resolving multi-track sound elements
      await new Promise(res => setTimeout(res, 400));
      setExportProgress(100);
    };

    try {
      await runBakingTasks();
      let finalFileUrl = mediaUrl; // default static or loop

      // Local manual upload saves to firebase storage
      if (selectedFile) {
        const userFolder = user?.uid || 'guest';
        const storageRef = ref(storage, `users/${userFolder}/creations/${Date.now()}_${selectedFile.name}`);
        const result = await uploadBytes(storageRef, selectedFile);
        finalFileUrl = await getDownloadURL(result.ref);
      }

      // Compile final payload post schema
      const finalFilterObj = PRESET_FILTERS.find(f => f.id === activeFilter) || PRESET_FILTERS[0];
      const metadataPayload = {
        userId: user?.uid || 'guest_editor',
        user: user?.displayName || 'Jose Luis Medina L.',
        avatar: user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        caption: postCaption + ` (PureAudio Render: ${finalFilterObj.name})`,
        videoUrl: mediaType === 'video' ? finalFileUrl : '',
        imageUrl: mediaType === 'image' ? finalFileUrl : '',
        songTitle: selectedTrack ? selectedTrack.title : 'Beat Loop Co-Op',
        artist: selectedTrack ? selectedTrack.artist : 'CapCut Sound Deck',
        coverUrl: selectedTrack ? selectedTrack.thumbnail : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80',
        likes: 125,
        comments: 2,
        views: '4.8k',
        createdAt: new Date().toISOString()
      };

      // Push to Firestore feeds
      try {
        await addDoc(collection(db, 'posts_social'), metadataPayload);
      } catch (dbError) {
        console.warn("Firestore save fallback context", dbError);
      }

      // Inject to local hooks active player feed context array
      addPost(
        metadataPayload.caption,
        mediaType === 'image' ? finalFileUrl : undefined,
        selectedTrack ? {
          id: selectedTrack.id,
          title: selectedTrack.title,
          artist: selectedTrack.artist,
          thumbnail: selectedTrack.thumbnail
        } : {
          id: 'sound_' + Date.now(),
          title: 'Direct PureAudio Sync',
          artist: 'CapCut Engine Pro',
          thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80'
        },
        mediaType === 'video' ? finalFileUrl : undefined
      );

      setIsExporting(false);
      setIsExportDone(true);
      notify(language === 'es' ? '¡Bucle exportado y publicado con éxito!' : 'Loop successfully compiled and published!', 'success');
    } catch (e: any) {
      console.error(e);
      setIsExporting(false);
      notify(language === 'es' ? 'Fallo en renderización' : 'Baking session issue occurred', 'info');
    }
  };

  // Mock voice recorder timer
  useEffect(() => {
    let interval: any;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setVoiceSecs(prev => {
          if (prev >= 15) {
            setIsRecordingVoice(false);
            notify(language === 'es' ? 'Límite de audio de grabadora alcanzado (15s)' : 'Audio recorder cap reached (15s)', 'success');
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setVoiceSecs(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  const toggleRecordingMock = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      notify(language === 'es' ? 'Grabando audio de voz directo...' : 'Voiceover recorder active...', 'info');
    } else {
      setIsRecordingVoice(false);
      addSystemHistoryAction(`Voice recording added`);
      notify(language === 'es' ? 'Audio superpuesto de micrófono sincronizado' : 'Track synchronized with microphones stream', 'success');
    }
  };

  // Karaoke Subtitle Resolver
  const currentSubtitleString = () => {
    if (!autoSubtitlesEnabled) return null;
    const block = autoSubtitlesText.find(b => playbackProgress >= b.start && playbackProgress <= b.end);
    return block ? block.text : null;
  };

  const currentFilterObj = PRESET_FILTERS.find(f => f.id === activeFilter) || PRESET_FILTERS[0];

  return (
    <div id="create_post_editor_screen" className="flex flex-col h-full bg-[#0E1015] text-[#E4E6EB] overflow-hidden select-none font-sans">
      
      {/* 
        ========================================================================
        CAPCUT HEADER: Cloud icon, customizable project name, undo/redo, 100% zoom, blue "Exportar"
        ========================================================================
      */}
      <header className="h-[52px] border-b border-[#252830] bg-[#181A20] px-4 flex items-center justify-between z-45 sticky top-0">
        
        {/* Left section: CapCut styled symbol & custom project title */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onNavigateBack}
            className="flex items-center gap-1 text-[13px] font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft size={16} />
            <svg className="w-5 h-5 fill-current text-sky-400 ml-1.5" viewBox="0 0 24 24">
              <path d="M11 15h2V9h-2v6zm-1.5 1h5V8h-5v8z M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5H11v-1.5h2v1.5zm0-2.5h-2V7h2v8z"/>
            </svg>
          </button>

          <div className="h-4 w-px bg-white/10" />

          {/* User Creator Nick & project stamp */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-650 text-white font-black text-[10px] flex items-center justify-center shadow">
              {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'J'}
            </span>
            <div className="text-left hidden md:block">
              <span className="text-[11px] font-black text-white block leading-none">
                {user?.displayName || 'Jose Luis Medina L.'}
              </span>
            </div>
            <ChevronDown size={11} className="text-gray-500 cursor-pointer hover:text-white" />
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Sync status and editable project item name */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-sky-400 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            <input 
              type="text" 
              value={projectIdName}
              onChange={(e) => setProjectIdName(e.target.value)}
              className="bg-transparent border-0 font-bold text-white text-[12.5px] w-28 md:w-36 focus:bg-[#252830] focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 outline-none font-mono"
              placeholder="Filename"
            />
            <ChevronDown size={11} className="text-gray-500 cursor-pointer" />
          </div>
        </div>

        {/* Center section: Undo, Redo, Zoom percentages indicators */}
        <div className="hidden lg:flex items-center gap-5">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={triggerUndo}
              className="p-1.5 hover:bg-white/5 active:bg-white/10 rounded-lg text-gray-400 hover:text-white cursor-pointer transition-colors"
              title="Deshacer (Undo)"
            >
              <Undo2 size={15} />
            </button>
            <button 
              onClick={triggerRedo}
              className="p-1.5 hover:bg-white/5 active:bg-white/10 rounded-lg text-gray-400 hover:text-white cursor-pointer transition-colors"
              title="Rehacer (Redo)"
            >
              <Redo2 size={15} />
            </button>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Zoom display */}
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-300 bg-[#252830] px-3 py-1 rounded-lg">
            <span>100%</span>
            <ChevronDown size={10} className="text-gray-400" />
          </div>

          {/* Help links */}
          <HelpCircle size={15} className="text-gray-400 hover:text-white cursor-pointer ml-1" />
        </div>

        {/* Right section: Blue "Exportar" CapCut button */}
        <div className="flex items-center gap-3">
          <button 
            onClick={publishToLiveFeed}
            className="bg-[#2A85FF] hover:bg-[#1A75FF] active:scale-95 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-sky-500/15 cursor-pointer transition-all border border-[#529CFF]"
          >
            <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 11h3l-4 4-4-4h3V8h2v5z"/>
            </svg>
            <span>{language === 'es' ? 'Exportar' : 'Export'}</span>
          </button>
          
          <button className="p-2 bg-[#252830] hover:bg-[#323642] rounded-lg text-gray-300 hover:text-white flex items-center justify-center">
            <LayoutGrid size={15} />
          </button>

          <span className="w-7 h-7 bg-orange-650 rounded-full border border-white/20 flex items-center justify-center text-[11px] font-black text-white font-mono">
            {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'J'}
          </span>
        </div>
      </header>

      {/* 
        ========================================================================
        MAIN BODY: Sidelining Tools Panel, Left Asset Panel, Center Canvas Workspace
        ========================================================================
      */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Leftmost Vertical CapCut Sideliner Action Tabs */}
        <nav className="w-[72px] bg-[#12141A] border-r border-[#252830] flex flex-col items-center py-4 justify-between shrink-0">
          
          {/* Top buttons shelf */}
          <div className="flex flex-col gap-5 w-full items-center">
            
            {/* Logo CapCut Icon at the top */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-cyan-400 flex items-center justify-center shadow-lg mb-3">
              <Scissors size={18} className="text-white transform -rotate-45" />
            </div>

            {/* TAB ITEMS */}
            {[
              { id: 'multimedia', icon: <Upload size={17} />, label: language === 'es' ? 'Multimedia' : 'Media' },
              { id: 'plantillas', icon: <Copy size={17} />, label: language === 'es' ? 'Plantillas' : 'Templates' },
              { id: 'elementos', icon: <Grip size={17} />, label: language === 'es' ? 'Elementos' : 'Elements' },
              { id: 'audio', icon: <Music size={17} />, label: 'Audio' },
              { id: 'texto', icon: <Type size={17} />, label: 'Texto' },
              { id: 'subtitulos', icon: <Tag size={17} />, label: 'Subtítulos' },
              { id: 'transcripcion', icon: <Scissors size={17} />, label: 'Transcrip.' },
              { id: 'efectos', icon: <Sparkles size={17} />, label: 'Efectos' }
            ].map((it) => {
              const active = sidebarTab === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => setSidebarTab(it.id as any)}
                  className={`w-14 py-2 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center select-none transition-all ${
                    active 
                      ? 'bg-[#252830] text-sky-450 font-black' 
                      : 'text-gray-400 hover:bg-[#1C1F26] hover:text-[#E4E6EB]'
                  }`}
                >
                  <div className={`${active ? 'scale-110 text-sky-400' : ''} transition-transform`}>
                    {it.icon}
                  </div>
                  <span className="text-[9.5px] font-bold tracking-tight block truncate w-full px-0.5 leading-none">
                    {it.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom buttons tools */}
          <div className="flex flex-col gap-3.5 items-center">
            <button className="w-9 h-9 text-gray-400 hover:text-white hover:bg-[#252830] rounded-xl flex items-center justify-center transition-all cursor-pointer">
              <ChevronDown size={14} />
            </button>
            <button className="w-9 h-9 text-gray-400 hover:text-white hover:bg-[#252830] rounded-xl flex items-center justify-center transition-all cursor-pointer" title="Hotkeys">
              <Keyboard size={15} />
            </button>
          </div>
        </nav>

        {/* Left Subpanel: Shelf displaying actual tools content depend on sidebar items select */}
        <aside className="w-[300px] md:w-[325px] bg-[#181A20] border-r border-[#252830] p-4 flex flex-col overflow-y-auto shrink-0 select-none text-left">
          
          {/* ==================== SUB-PANEL: MULTIMEDIA ==================== */}
          {sidebarTab === 'multimedia' && (
            <div className="space-y-4 flex flex-col h-full">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">{language === 'es' ? 'Recursos Multimedia' : 'Media Directory'}</h3>
                <p className="text-[10px] text-gray-400 leading-tight">Agrega videos y pistas auditivas al lienzo lineal.</p>
              </div>

              {/* CapCut Styled "Cargar" blue cloud upload action */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-[#2A85FF]/10 hover:bg-[#2A85FF]/20 text-[#2A85FF] rounded-[10px] border border-dashed border-[#2A85FF]/40 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Upload size={14} />
                <span>{language === 'es' ? 'Cargar desde galeria' : 'Upload File'}</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFileLoad(file);
                }}
                accept="video/*,image/*" 
                className="hidden" 
              />

              {/* Aspect togglers (Smartphone vs desktop orientation) */}
              <div className="grid grid-cols-2 gap-2 bg-[#12141A] p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => setAspectRatio('9:16')}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    aspectRatio === '9:16' ? 'bg-[#252830] text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Smartphone size={11} className="text-sky-400" />
                  <span>Vertical 9:16</span>
                </button>
                <button 
                  onClick={() => setAspectRatio('16:9')}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    aspectRatio === '16:9' ? 'bg-[#252830] text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Monitor size={11} className="text-sky-400" />
                  <span>Widescreen</span>
                </button>
              </div>

              {/* REALISTIC CapCut PROMO BOX AD CAMPAIGN */}
              <div className="p-3 bg-gradient-to-r from-purple-950/45 to-[#1A1135] border border-purple-500/20 rounded-[14px] text-left space-y-1.5 flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-[#FF216F] flex items-center justify-center text-[8px] font-black text-white leading-none">B</span>
                  <span className="text-[10.5px] font-black tracking-tight text-white uppercase italic">Binnit AI Writer</span>
                </div>
                <p className="text-[9.5px] text-purple-200 font-medium leading-relaxed">
                  Crea increíbles contenidos de marketing en formato 9:16 con tan solo unos clics.
                </p>
                <button 
                  onClick={() => {
                    choosePresetLoop(SAMPLE_LOOPS[0].url, SAMPLE_LOOPS[0].name);
                    notify(language === 'es' ? 'Filtro de IA aplicado automáticamente' : 'AI preset loop loaded instantly', 'success');
                  }}
                  className="bg-[#7C4DFF] hover:bg-[#8C5DFF] text-white text-[9.5px] font-black rounded-lg px-2.5 py-1 w-fit mt-1 self-start transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span>Probar ahora</span>
                  <span>&rarr;</span>
                </button>
              </div>

              {/* Grid of uploaded/Recent items with hover overlays */}
              <div className="flex-1 space-y-2">
                <span className="text-[9.5px] font-mono text-gray-400 uppercase tracking-widest font-black block">Biblioteca Reciente:</span>
                
                <div className="grid grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1">
                  {SAMPLE_LOOPS.map((item, index) => {
                    const activeMedia = mediaUrl === item.url;
                    return (
                      <div 
                        key={index}
                        onClick={() => choosePresetLoop(item.url, item.name)}
                        className={`group relative aspect-[3/4] h-24 rounded-lg overflow-hidden border cursor-pointer bg-[#12141A] transition-all flex flex-col justify-end ${
                          activeMedia ? 'border-sky-500 ring-2 ring-sky-500/30 shadow-md' : 'border-white/5 hover:border-white/20'
                        }`}
                      >
                        <img 
                          src={item.thumb} 
                          alt="" 
                          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        
                        {/* Duration badge clip */}
                        <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white font-mono text-[7px] px-1 py-0.5 rounded leading-none">
                          {item.durationText}
                        </span>

                        {/* Hover addition element */}
                        <div className="absolute inset-0 bg-[#000000]/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Plus size={16} className="text-white drop-shadow-md" />
                        </div>

                        <div className="relative p-1.5 z-10 w-full min-w-0">
                          <p className="text-[8px] font-mono font-bold text-white truncate text-left">{item.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Project settings reset */}
              <button 
                onClick={handleClearProject}
                className="w-full py-2 border border-[#FF3B30]/30 hover:bg-[#FF3B30]/10 text-[#FF3B30] font-black text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
              >
                {language === 'es' ? 'Limpiar Lienzo' : 'Clear Canvas'}
              </button>
            </div>
          )}

          {/* ==================== SUB-PANEL: PLANTILLAS ==================== */}
          {sidebarTab === 'plantillas' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">{language === 'es' ? 'Plantillas de Loops' : 'Video Loop Templates'}</h3>
                <p className="text-[10px] text-gray-450 leading-tight">Clips pre-renderizados ideales como fondo estético de alta frecuencia.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Neon Space Retro", url: "https://assets.mixkit.co/videos/preview/mixkit-retro-futuristic-music-visualizer-with-a-cassette-43015-large.mp4", thumb: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=300&q=80" },
                  { name: "Night Club Spinner", url: "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-alone-in-a-nightclub-spinning-lights-42517-large.mp4", thumb: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&w=300&q=80" },
                  { name: "Glowing Deck VHS", url: "https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-cassette-player-close-up-43033-large.mp4", thumb: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80" },
                  { name: "Virtual Concert DJ", url: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-dj-controlling-a-sound-mixer-at-a-party-41620-large.mp4", thumb: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80" }
                ].map((loop, idx) => (
                  <div 
                    key={idx}
                    onClick={() => choosePresetLoop(loop.url, loop.name)}
                    className="group relative h-24 rounded-lg overflow-hidden border border-white/5 hover:border-sky-500 cursor-pointer transition-all flex flex-col justify-end"
                  >
                    <img src={loop.thumb} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent" />
                    <div className="p-1.5 relative z-10 w-full min-w-0">
                      <span className="text-[7.5px] font-black uppercase text-sky-450 tracking-wide font-mono leading-none">AESTHETIC LOOP</span>
                      <p className="text-[9.5px] font-bold text-white truncate max-w-full leading-tight">{loop.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== SUB-PANEL: ELEMENTOS ==================== */}
          {sidebarTab === 'elementos' && (
            <div className="space-y-4 text-left">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">{language === 'es' ? 'Elementos y Stickers' : 'Stickers & Shapes overlay'}</h3>
                <p className="text-[10px] text-gray-450 leading-tight">Clikea un sticker flotante CapCut para arrastrarlo en el lienzo.</p>
              </div>

              <div className="bg-[#12141A] p-3.5 rounded-xl border border-white/5 space-y-2.5">
                <span className="text-[8.5px] font-mono text-gray-450 block font-bold leading-none UPPERCASE">STICKERS FLOTANTES:</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {PRESET_STICKERS.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => addStickerSymbol(symbol)}
                      className="text-2xl p-1.5 hover:bg-white/5 hover:scale-105 active:scale-95 rounded-lg text-center cursor-pointer transition-all"
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-sky-950/15 border border-sky-500/10 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-sky-400 font-black block">💡 CONTROL DE CAPAS:</span>
                <p className="text-[8.5px] text-gray-400 leading-normal">
                  Puedes dar click y arrastrar el sticker colocado en la pantalla de visualización para posicionarlo en cualquier parte.
                </p>
              </div>
            </div>
          )}

          {/* ==================== SUB-PANEL: AUDIO TRACK ==================== */}
          {sidebarTab === 'audio' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">{language === 'es' ? 'Audios y Bandas' : 'YouTube Sound Index'}</h3>
                <p className="text-[10px] text-gray-455">Estabiliza pistas para el fondo sónico de tu bucle.</p>
              </div>

              {/* Mix Vol Controls */}
              <div className="bg-[#12141A] p-3 rounded-xl border border-white/5 space-y-2.5 text-[9.5px]">
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-gray-400">
                    <span>AUDIO DEL VIDEO:</span>
                    <span className="text-white font-bold">{originalVolume}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={originalVolume} 
                    onChange={(e) => setOriginalVolume(Number(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-gray-400">
                    <span>AUDIO DE PISTA (FIBRA):</span>
                    <span className="text-white font-bold">{bgVolume}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={bgVolume} 
                    onChange={(e) => setBgVolume(Number(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>
              </div>

              {/* Audio Search Engine Catalog */}
              <div className="space-y-2">
                <span className="text-[8.5px] font-mono text-[#A0A0B8] font-black uppercase tracking-wider block">Catálogo Sónico Integrado:</span>
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Buscar temas en YouTube..." 
                    value={musicSearchQuery}
                    onChange={(e) => setMusicSearchQuery(e.target.value)}
                    className="w-full bg-[#12141A] pl-8 pr-3 py-2 rounded-lg border border-white/5 focus:border-[#2A85FF] text-[10.5px] text-white focus:outline-none placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {musicLoading ? (
                    <div className="py-6 text-center text-[9px] font-mono text-gray-500 flex flex-col items-center justify-center gap-1.5">
                      <RefreshCw size={12} className="text-sky-400 animate-spin" />
                      <span>BUSCANDO PISTA EN YOUTUBE...</span>
                    </div>
                  ) : (
                    musicResults.map((t) => {
                      const selected = selectedTrack?.id === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTrack(selected ? null : t);
                            addSystemHistoryAction(selected ? "Muted Audio" : `Sound Track Selected: ${t.title}`);
                          }}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all ${
                            selected 
                              ? 'bg-sky-500/10 border-sky-500 text-white shadow-lg' 
                              : 'bg-black/25 border-white/5 text-gray-300 hover:border-white/10'
                          }`}
                        >
                          <img src={t.thumbnail} alt="" className="w-6 h-6 rounded object-cover" />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-[9.5px] font-black truncate leading-tight">{t.title}</p>
                            <p className="text-[8px] text-gray-450 truncate leading-none mt-0.5">{t.artist}</p>
                          </div>
                          <span className="text-[7.5px] font-mono text-sky-400 font-bold pr-1">
                            {selected ? <Check size={10} className="inline-block" /> : 'PICK'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-PANEL: TEXTO OVERLAY ==================== */}
          {sidebarTab === 'texto' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">{language === 'es' ? 'Títulos de pantalla' : 'Movable Screen Titles'}</h3>
                <p className="text-[10px] text-gray-455">Añade títulos flotantes de neón estéticos estilo CapCut.</p>
              </div>

              <form onSubmit={addCustomStaticLabel} className="space-y-2">
                <span className="text-[8.5px] font-mono text-gray-400 block font-bold">INTRODUCE TEXTO NEÓN (VERDE):</span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ej: HIGH VIBE ONLY..." 
                    value={addedText}
                    onChange={(e) => setAddedText(e.target.value)}
                    className="flex-1 bg-[#12141A] rounded-lg border border-white/5 focus:border-sky-500 text-[10.5px] px-2.5 py-2 text-white focus:outline-none placeholder:text-gray-500"
                  />
                  <button 
                    type="submit"
                    className="bg-[#2A85FF] hover:bg-[#1A75FF] text-white font-black text-xs px-3.5 rounded-lg flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </form>

              <div className="p-3 bg-slate-900 border border-white/5 rounded-xl space-y-1.5 text-xs">
                <span className="text-[9px] font-mono font-bold text-gray-400">TÍTULOS COLOCADOS:</span>
                {placedTexts.length === 0 ? (
                  <p className="text-[9px] text-gray-500 italic">Ninguno por ahora.</p>
                ) : (
                  <div className="space-y-1">
                    {placedTexts.map((txt) => (
                      <div key={txt.id} className="flex justify-between items-center bg-[#12141A] p-1.5 rounded border border-white/5">
                        <span className="text-[9.5px] text-[#00df82] font-black truncate max-w-[190px]">{txt.text}</span>
                        <button onClick={() => removeText(txt.id)} className="text-red-500 text-[9px] font-bold">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== SUB-PANEL: SUBTÍTULOS ==================== */}
          {sidebarTab === 'subtitulos' && (
            <div className="space-y-4 text-left">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">{language === 'es' ? 'Transcripción de Karaoke' : 'AI Speech Karaoke Lyrics'}</h3>
                <p className="text-[10px] text-gray-450 leading-tight">La IA procesará la pista y generará karaoke superpuesto instantáneo.</p>
              </div>

              <button
                onClick={generateAILyricsKaraoke}
                disabled={isGeneratingSubs}
                className="w-full py-2.5 bg-gradient-to-r from-sky-400/20 via-[#2A85FF]/25 to-sky-950/5 hover:brightness-110 border border-[#2A85FF]/30 rounded-xl text-sky-400 font-black uppercase text-[9.5px] tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isGeneratingSubs ? (
                  <>
                    <RefreshCw size={11} className="animate-spin text-white" />
                    <span>DECODIFICANDO DIALOGOS...</span>
                  </>
                ) : autoSubtitlesEnabled ? (
                  <>
                    <Check size={11} className="text-[#00df82]" />
                    <span>SUBTÍTULOS KARAOKE INCORPORADOS</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={11} className="animate-pulse text-sky-300" />
                    <span>GENERAR SUBTÍTULOS CON IA</span>
                  </>
                )}
              </button>

              <div className="space-y-1.5">
                <span className="text-[9px] font-mono text-gray-400 block font-bold">VISTA PREVIA DE CAPTION SINCRÓNICA:</span>
                <div className="p-3 bg-[#12141A] rounded-xl border border-white/5 text-[9px] text-gray-400 leading-relaxed font-mono">
                  {autoSubtitlesEnabled ? (
                    <div className="space-y-1">
                      <p className="text-white"><span className="text-sky-400">[0s-2.5s]:</span> UN RECORRIDO POR EL UNIVERSO SÓNICO</p>
                      <p className="text-white"><span className="text-sky-400">[3s-6.5s]:</span> INTENSIDAD TOTAL AL MÁXIMO ESTILO</p>
                      <p className="text-white"><span className="text-sky-400">[7s-10s]:</span> PUREAUDIO COMPOSITOR LUXURY</p>
                    </div>
                  ) : (
                    <p className="italic text-gray-550">Inicia la inteligencia artificial para previsualizar los tiempos.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-PANEL: TRANSCRIPCIÓN (VOICE ANALYTICS) ==================== */}
          {sidebarTab === 'transcripcion' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">{language === 'es' ? 'Transcripción de Voz' : 'Voice analytics speech-to-text'}</h3>
                <p className="text-[10px] text-gray-455">Transcripción vocal inteligente a bloques de texto interactivos.</p>
              </div>

              <div className="p-3 bg-[#12141A] rounded-xl border border-white/5 space-y-3 text-[10px]">
                <p className="text-gray-400 text-[9.5px]">Masteriza tu propia voz superpuesta para crear un bock de feed social premium.</p>
                
                <button 
                  onClick={toggleRecordingMock}
                  className={`w-full py-2 rounded-lg font-black uppercase text-[9.5px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isRecordingVoice 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
                >
                  <Mic size={11} />
                  <span>{isRecordingVoice ? `GRABANDO MICROFONO (00:0${voiceSecs})` : 'GRABAR MI DECK DE VOZ'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ==================== SUB-PANEL: EFECTOS (FIBRA EFECTS) ==================== */}
          {sidebarTab === 'efectos' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">{language === 'es' ? 'Efectos y Atmosferas' : 'Filters & Matrix Color'}</h3>
                <p className="text-[10px] text-gray-455">Colorimetría analógica y destellos cinematográficos estilo CapCut.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {PRESET_FILTERS.map((f) => {
                  const active = activeFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        setActiveFilter(f.id);
                        addSystemHistoryAction(`Filter Grading: ${f.name}`);
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        active 
                          ? 'bg-sky-500/15 border-sky-500 text-white shadow-md' 
                          : 'bg-[#12141A] border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <Sparkles size={11} className={`${active ? 'text-sky-400' : 'text-gray-500'} mb-1.5`} />
                      <p className="text-[9.5px] font-black leading-tight truncate">{f.name}</p>
                    </button>
                  );
                })}
              </div>

              <div className="bg-[#12141A] p-3 rounded-xl border border-white/5 space-y-3.5 text-[9.5px]">
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-gray-400">
                    <span>NIVEL BRILLO COPA:</span>
                    <span className="text-white font-bold">{filterBrightness}%</span>
                  </div>
                  <input 
                    type="range" min="50" max="150" value={filterBrightness} 
                    onChange={(e) => setFilterBrightness(Number(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-gray-400">
                    <span>NIVEL SATURACIÓN:</span>
                    <span className="text-white font-bold">{filterSaturation}%</span>
                  </div>
                  <input 
                    type="range" min="40" max="200" value={filterSaturation} 
                    onChange={(e) => setFilterSaturation(Number(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>
              </div>
            </div>
          )}

        </aside>

        {/* 
          ========================================================================
          CENTER MAIN WORKSPACE LAYER: Previews on canvas background with guidance rulers
          ========================================================================
        */}
        <main className="flex-1 bg-[#1E2028] flex flex-col relative overflow-hidden">
          
          {/* Centered stage background subtle checked pattern */}
          <div className="absolute inset-0 bg-[#14151B] bg-[radial-gradient(#ffffff03_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Canvas action bar header (Holds "Relación" aspect ratios changer) */}
          <div className="absolute top-4 left-4 z-30">
            <div className="relative">
              <button 
                onClick={() => setIsRelacionDropdownOpen(!isRelacionDropdownOpen)}
                className="bg-[#1E2028]/95 hover:bg-[#252834] border border-[#2F323E] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-lg select-none cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-none stroke-current text-sky-450" viewBox="0 0 24 24" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                <span>Relación • {aspectRatio}</span>
                <ChevronDown size={11} className="text-gray-400" />
              </button>

              <AnimatePresence>
                {isRelacionDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-0 mt-1.5 w-36 bg-[#181A20] border border-[#2F323E] rounded-lg shadow-2xl p-1 z-50 text-left"
                  >
                    {[
                      { id: '9:16', label: '9:16 (Tik Tok)', detail: 'Shorts/Reels' },
                      { id: '16:9', label: '16:9 (Wide)', detail: 'YouTube / PC' },
                      { id: '1:1', label: '1:1 (Square)', detail: 'Instagram' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setAspectRatio(opt.id as any);
                          setIsRelacionDropdownOpen(false);
                          addSystemHistoryAction(`Aspect Ratio: ${opt.id}`);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-[10px] font-bold block text-gray-300 hover:bg-[#252830] hover:text-white transition-colors cursor-pointer"
                      >
                        <span className="block font-black uppercase">{opt.label}</span>
                        <span className="text-[8.5px] text-gray-500 block leading-none">{opt.detail}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Stage Core Content Canvas container */}
          <div ref={canvasContainerRef} className="flex-1 flex items-center justify-center p-6 pb-2">
            
            {/* Center CapCut viewport box (Responsive Aspect Ratio frame) */}
            <div 
              className="relative transition-all duration-300 shadow-[0_30px_70px_rgba(0,0,0,0.95)] border-2 border-[#252830] overflow-hidden bg-black flex items-center justify-center"
              style={{
                width: aspectRatio === '9:16' ? '215px' : aspectRatio === '16:9' ? '390px' : '285px',
                height: aspectRatio === '9:16' ? '380px' : aspectRatio === '16:9' ? '220px' : '285px',
                borderRadius: '16px'
              }}
            >
              
              {/* If empty project backdrop */}
              {!mediaUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-[#15171C]">
                  
                  {/* Plus big icon button */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,196,255,0.4)] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  >
                    <Plus size={26} strokeWidth={2.5} />
                  </button>

                  <h4 className="text-xs font-black text-white mt-4">{language === 'es' ? 'Haz clic para cargar' : 'Click to Upload'}</h4>
                  <p className="text-[9.5px] text-gray-500 mt-1 leading-normal">
                    {language === 'es' ? 'O arrastra y suelta el archivo aquí' : 'Or drag and drop media components here'}
                  </p>

                  {/* Dropbox and google drive indicators mimicking CapCut screenshot */}
                  <div className="flex gap-2 mt-5">
                    <button className="px-3 py-1 bg-[#252830]/80 hover:bg-[#323642] text-[9.5px] font-bold rounded-lg border border-white/5 text-gray-300 cursor-pointer flex items-center gap-1">
                      <svg className="w-3 h-3 fill-current text-sky-400" viewBox="0 0 24 24">
                        <path d="M12.012 3L3 8.356l4.5 2.802L16.512 5.8l-4.5-2.8z M3 15.6l9.012 5.4 9.012-5.4-9.012-5.4L3 15.6zm4.5-4.444L12 13.956l4.5-2.8v2.8L12 16.756l-4.5-2.8v-2.8z" />
                      </svg>
                      <span>Drive</span>
                    </button>
                    <button className="px-3 py-1 bg-[#252830]/80 hover:bg-[#323642] text-[9.5px] font-bold rounded-lg border border-white/5 text-gray-300 cursor-pointer flex items-center gap-1">
                      <svg className="w-3 h-3 fill-current text-blue-500" viewBox="0 0 24 24">
                        <path d="M3 12.012l6 3.656-6 3.655v-7.311zm6 3.656l6-3.656 6 3.656-6 3.655-6-3.655zm12-3.656l-6 3.656 6 3.655v-7.311zm-12-7.312l6 3.656-6 3.656-6-3.656 6-3.656zm6 3.656l6-3.656 6 3.656-6 3.656-6-3.656z" />
                      </svg>
                      <span>Dropbox</span>
                    </button>
                  </div>
                </div>
              ) : (
                
                /* Render Dynamic Frame Player with customizable brightness elements */
                <div className={`relative w-full h-full text-center flex flex-col justify-between p-4 ${currentFilterObj.cssClass}`}>
                  
                  {/* Embedded visual renderer element */}
                  <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
                    {mediaType === 'video' ? (
                      <video
                        ref={videoRef}
                        src={mediaUrl}
                        className="w-full h-full object-cover"
                        loop
                        muted
                        playsInline
                        style={{
                          filter: `brightness(${filterBrightness}%) saturate(${filterSaturation}%)`,
                        }}
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{
                          filter: `brightness(${filterBrightness}%) saturate(${filterSaturation}%)`,
                        }}
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {/* Gradient Overlay bottom to preserve labels readable */}
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
                  </div>

                  {/* Frame Metadata (TikTok Overlay representation) */}
                  <div className="flex justify-between items-center text-[8px] font-mono text-white/50 z-20 select-none">
                    <span className="flex items-center gap-1 text-red-500 font-bold">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                      LIVE REVIEW
                    </span>
                    <span>00:0{Math.floor((playbackProgress / 100) * totalClipDuration)} • 9:16</span>
                  </div>

                  {/* Draggable Stickers layer */}
                  {placedStickers.map((sticker) => (
                    <motion.div
                      drag
                      dragConstraints={{ left: -30, right: 190, top: -20, bottom: 250 }}
                      key={sticker.id}
                      style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
                      className="absolute z-30 cursor-crosshair text-2xl hover:ring-2 hover:ring-sky-500 rounded p-1 group select-none"
                    >
                      {sticker.symbol}
                      <button 
                        onClick={() => removeSticker(sticker.id)}
                        className="absolute -top-3.5 -right-3.5 w-4.5 h-4.5 bg-red-600 border border-black text-white rounded-full flex items-center justify-center text-[8.5px] opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}

                  {/* Movable custom texts labels */}
                  {placedTexts.map((txtItem) => (
                    <motion.div
                      drag
                      dragConstraints={{ left: -30, right: 190, top: -20, bottom: 250 }}
                      key={txtItem.id}
                      style={{ left: `${txtItem.x}%`, top: `${txtItem.y}%` }}
                      className="absolute z-30 cursor-move text-[10.5px] uppercase font-black tracking-widest px-2.5 py-1.5 bg-[#0C1014]/90 border border-[#00df82]/40 text-white rounded shadow-2xl group select-none flex items-center gap-1 hover:ring-2 hover:ring-sky-500"
                    >
                      <span className="text-[#00df82] select-none font-sans font-black">{txtItem.text}</span>
                      <button 
                        onClick={() => removeText(txtItem.id)}
                        className="ml-1 text-[8px] opacity-35 hover:opacity-100 font-extrabold"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}

                  {/* CapCut Auto-Karaoke Synced subtitling blocks floating on background */}
                  <div className="absolute inset-x-2 bottom-12 z-35 text-center pointer-events-none">
                    <AnimatePresence mode="wait">
                      {currentSubtitleString() && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -5 }}
                          className="bg-black/85 border border-sky-450 px-3 py-1.5 rounded-lg text-[9px] tracking-wider text-white uppercase font-black inline-flex items-center gap-1.5 shadow-2xl"
                        >
                          <Sparkles size={10} className="text-yellow-400 animate-spin" />
                          <span>{currentSubtitleString()}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Bottom TikTok user info represent cards */}
                  <div className="flex justify-between items-end z-20 pointer-events-none text-left">
                    <div className="min-w-0 pr-3 select-none">
                      <p className="text-[10px] font-black tracking-wide text-white leading-none">
                        @{user?.displayName?.replace(/\s+/g, '').toLowerCase() || 'josemedina_creative'}
                      </p>
                      <p className="text-[8px] text-gray-300 mt-1 truncate max-w-[150px]">
                        {selectedTrack ? `${selectedTrack.title} - ${selectedTrack.artist}` : 'Vibe Loop • CapCut Sync'}
                      </p>
                    </div>
                    <div className="w-6.5 h-6.5 rounded-full border border-sky-400 bg-sky-500/10 flex items-center justify-center text-sky-400 font-black text-[9px] flex-shrink-0 animate-pulse">
                      PA
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

        </main>
      </div>

      {/* 
        ========================================================================
        LINEAR TIMELINE CONTROLS: Play/Pause, Split scissor [|], Volume sliders, and Multi-tracks
        ========================================================================
      */}
      <section className="bg-[#12141A] border-t border-[#252830] select-none shrink-0" style={{ height: '185px' }}>
        
        {/* Playback action bar controls: Crop, Split, micro recorder, countdown */}
        <div className="h-[44px] bg-[#181A20] border-b border-[#252830] px-4 flex items-center justify-between">
          
          {/* Timeline tools action cursors */}
          <div className="flex items-center gap-1 text-gray-400">
            <button 
              onClick={() => {
                if (videoRef.current) {
                  const curr = videoRef.current.currentTime;
                  notify(language === 'es' ? `Corte de clip realizado en la marca ${curr.toFixed(1)}s` : `Clip splitted at marks ${curr.toFixed(1)}s`, 'success');
                  addSystemHistoryAction(`Split at ${curr.toFixed(1)}s`);
                }
              }}
              className="p-1.5 hover:bg-[#252830] rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Dividir / Cut at playhead"
            >
              <Scissors size={15} />
            </button>
            <button 
              onClick={handleClearProject}
              className="p-1.5 hover:bg-[#252830] rounded-lg text-[#FF3B30] hover:text-[#FF453A] transition-colors cursor-pointer"
              title="Borrar todo"
            >
              <Trash2 size={15} />
            </button>
            <button 
              onClick={toggleRecordingMock}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer relative ${isRecordingVoice ? 'bg-red-500/10 text-red-500' : 'hover:bg-[#252830] text-gray-300 hover:text-white'}`}
              title="Grabadora de Vozover"
            >
              <Mic size={15} className={isRecordingVoice ? 'animate-pulse' : ''} />
              {isRecordingVoice && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono text-[7px] w-3 h-3 rounded-full flex items-center justify-center font-black">
                  {voiceSecs}
                </span>
              )}
            </button>
            <button 
              className="p-1.5 hover:bg-[#252830] rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Ajuste Magnético"
            >
              <Magnet size={15} className="text-sky-400" />
            </button>
          </div>

          {/* Central Playhead indicators and active timer stamp */}
          <div className="flex items-center gap-4 text-xs font-mono">
            
            {/* Play trigger center bullet */}
            <button 
              onClick={() => {
                setIsPlaying(!isPlaying);
                if (videoRef.current) {
                  if (isPlaying) videoRef.current.pause();
                  else videoRef.current.play().catch(() => {});
                }
              }}
              className="w-7 h-7 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
            >
              {isPlaying ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" className="ml-0.5" />}
            </button>

            {/* Timings index */}
            <div className="text-gray-300 flex items-center gap-1">
              <span className="font-bold text-white">
                00:00:{Math.floor((playbackProgress / 100) * totalClipDuration).toString().padStart(2, '0')}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-450 font-bold">
                00:00:15
              </span>
            </div>
          </div>

          {/* Scale controls */}
          <div className="flex items-center gap-3.5 text-gray-400">
            {/* Speed loop iterations */}
            <div className="flex items-center gap-1.5 bg-[#252830] px-2 py-0.5 rounded text-[10px] font-bold text-sky-400 font-mono">
              <span>SPEED:</span>
              <button 
                onClick={() => {
                  const speeds: (0.5 | 1.0 | 1.5 | 2.0)[] = [0.5, 1.0, 1.5, 2.0];
                  const cur = speeds.indexOf(speed);
                  const next = speeds[(cur + 1) % speeds.length];
                  setSpeed(next);
                  if (videoRef.current) videoRef.current.playbackRate = next;
                  addSystemHistoryAction(`Tempo speed: ${next}x`);
                }}
                className="hover:text-white font-black"
              >
                {speed}x
              </button>
            </div>

            <div className="h-4 w-px bg-white/10" />

            {/* Slider zoom representation */}
            <span className="text-[10px] font-mono select-none font-black">-</span>
            <div className="w-16 h-1 bg-[#252830] rounded-full relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-sky-500 w-[60%]" />
            </div>
            <span className="text-[10px] font-mono select-none font-black">+</span>

            <Maximize2 size={13} className="text-gray-400 hover:text-white cursor-pointer" />
          </div>
        </div>

        {/* Multi-track Timeline Channels Grid */}
        <div 
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            // Offset logic to scrub playhead
            const offset = e.clientX - rect.left;
            const percentage = (offset / rect.width) * 100;
            handleTimelineScrub(percentage);
          }}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-[#121419] relative cursor-col-resize h-[141px]"
        >
          {/* NEON RED PLAYHEAD LINE POINTER TRACKER */}
          <div 
            className="absolute top-0 bottom-0 bg-sky-400 w-0.5 z-40 pointer-events-none shadow-[0_0_8px_#38bdf8] transition-all"
            style={{ left: `${playbackProgress}%` }}
          />

          {/* 1. TIMELINE GRADUATION SCALE RULER */}
          <div className="h-5 bg-[#181A20] border-b border-[#252830] relative flex justify-between px-4 text-[8.5px] font-mono text-gray-500 pointer-events-none z-10 leading-relaxed">
            <span>00:00</span>
            <span>00:02</span>
            <span>00:04</span>
            <span>00:06</span>
            <span>00:08</span>
            <span>00:10</span>
            <span>00:12</span>
            <span>00:14</span>
            <span>00:15 (Fin del loop)</span>
          </div>

          {/* 2. TRACK 1: VIDEO CHANNEL CONTAINER */}
          <div className="h-[38px] border-b border-[#252830] relative flex items-center pr-1 pointer-events-none bg-black/5">
            <div className="absolute left-2 text-[8px] font-mono font-black uppercase text-gray-500 z-10 tracking-widest flex items-center gap-1">
              <Film size={10} className="text-sky-400" />
              <span>Video_Track_1</span>
            </div>
            
            {/* Video preview thumb visual roll representation */}
            <div className="absolute left-24 right-4 top-1.5 bottom-1.5 rounded-lg bg-[#252830]/40 border border-[#2F323E] overflow-hidden flex items-center gap-0.5 p-0.5">
              <div className="h-full flex-1 bg-sky-650/10 flex gap-1 opacity-25">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-sky-500 rounded-sm" />
                ))}
              </div>

              {/* Glowing trimmed bracket segment highlights */}
              <div 
                className="absolute top-0 bottom-0 bg-sky-500/15 border-l-[3px] border-sky-400 z-25 w-1"
                style={{ left: `${trimStart}%` }}
              />
              <div 
                className="absolute top-0 bottom-0 bg-sky-500/5 z-20 border-t border-b border-sky-400/30"
                style={{ left: `${trimStart}%`, right: `${100 - trimEnd}%` }}
              />
              <div 
                className="absolute top-0 bottom-0 bg-sky-500/15 border-r-[3px] border-sky-400 z-25 w-1"
                style={{ right: `${100 - trimEnd}%` }}
              />
              <span className="absolute right-3 text-[7.5px] text-gray-400 font-mono font-bold">15.0s</span>
            </div>
          </div>

          {/* 3. TRACK 2: SOUND OVERLAY CHANNEL */}
          <div className="h-[38px] border-b border-[#252830] relative flex items-center pr-1 pointer-events-none bg-black/5">
            <div className="absolute left-2 text-[8px] font-mono font-black uppercase text-gray-500 z-10 tracking-widest flex items-center gap-1">
              <Music size={10} className="text-[#00df82]" />
              <span>Audio_Track_1</span>
            </div>

            {selectedTrack ? (
              <div className="absolute left-24 right-4 top-1.5 bottom-1.5 rounded-lg bg-[#00df82]/10 border border-[#00df82]/30 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded overflow-hidden">
                    <img src={selectedTrack.thumbnail} className="object-cover w-full h-full" alt="" />
                  </div>
                  <span className="text-[9px] text-[#00df82] font-black truncate max-w-[200px] font-mono leading-none">
                    {selectedTrack.title.toUpperCase()}
                  </span>
                </div>
                
                {/* Visual waveform graphs indicators */}
                <div className="flex items-center gap-0.5 h-3 opacity-60">
                  {[20, 60, 40, 80, 50, 90, 30, 70, 40, 60, 20].map((h, i) => (
                    <div key={i} className="w-[1.5px] bg-[#00df82] rounded-full" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            ) : (
              <span className="absolute left-32 text-[8.5px] italic text-gray-600 font-mono select-none">
                Arrastra y suelta pista de Youtube o lofi aquí
              </span>
            )}
          </div>

          {/* 4. TRACK 3: TEXT & OVERLAY CHANNELS HIGHLIGHTS */}
          <div className="h-[38px] relative flex items-center pr-1 pointer-events-none bg-black/5">
            <div className="absolute left-2 text-[8px] font-mono font-black uppercase text-gray-500 z-10 tracking-widest flex items-center gap-1">
              <Type size={10} className="text-[#FF216F]" />
              <span>Overlay_Blocks</span>
            </div>

            {(placedStickers.length > 0 || placedTexts.length > 0) ? (
              <div className="absolute left-[20%] right-[20%] top-1.5 bottom-1.5 bg-[#FF216F]/15 border border-[#FF216F]/40 rounded-lg flex items-center justify-between px-3 text-[#FF216F] font-mono text-[8px] font-black tracking-wider shadow">
                <span>TEXTO Y EMOTICONOS ACTIVOS ({placedStickers.length + placedTexts.length})</span>
                <span className="text-[7px] bg-[#FF216F]/20 px-1 rounded">0.0s - 15.0s</span>
              </div>
            ) : (
              <span className="absolute left-32 text-[8.5px] italic text-gray-650 font-mono select-none">
                Estabilice elementos y stickers en el lienzo
              </span>
            )}
          </div>

        </div>
      </section>

      {/* Hidden audio element used for playing dynamic previews safely */}
      {selectedTrack && (
        <audio
          ref={audioPreviewRef}
          src={`https://www.youtube.com/watch?v=${selectedTrack.id}`} 
          className="hidden"
          loop
        />
      )}

      {/* 
        ========================================================================
        HOLOGRAPHIC COMPRESSED PROGRESS EXPORTER MODAL VIEW
        ========================================================================
      */}
      <AnimatePresence>
        {isExporting && (
          <div className="fixed inset-0 bg-[#0E1015]/95 backdrop-blur-xl flex flex-col items-center justify-center z-[150] p-6 text-center select-none cursor-wait">
            <div className="space-y-6 max-w-sm">
              
              {/* Spinning nodes loader */}
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-[3.5px] border-sky-500/15 rounded-full" />
                <div className="absolute inset-0 border-[3.5px] border-t-sky-400 border-r-sky-500 rounded-full animate-spin" />
              </div>

              <div className="space-y-2.5">
                <span className="text-[9.5px] font-mono font-black text-sky-450 uppercase tracking-[0.25em] block">CONVIRTIENDO LIENZO EN SEÑAL REAL...</span>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">{language === 'es' ? 'Codificando Bucle 9:16' : 'Linear Render Execution'}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Compilando fotogramas, ecualizando pistas de YouTube, superponiendo títulos decorativos y guardando datos en Firestore.
                </p>
              </div>

              {/* Progress Line */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10.5px] font-mono font-black text-white">
                  <span>PROGRESO RENDER:</span>
                  <span className="text-sky-400">{exportProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/[0.03]">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-[#1A75FF] transition-all duration-300" style={{ width: `${exportProgress}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS PUBLICATION WINNER PROMPT OVERLAY PANEL */}
      <AnimatePresence>
        {isExportDone && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center z-[150] p-6 text-center select-none">
            <div className="bg-[#181A20] border border-[#252830] rounded-2xl p-7 space-y-5 max-w-sm shadow-2xl text-left relative">
              
              <div className="w-14 h-14 bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-500/30 mx-auto shadow-[0_0_20px_rgba(42,133,255,0.2)]">
                <Check size={28} className="text-sky-400" />
              </div>
              
              <div className="text-center space-y-1.5">
                <span className="text-[9.5px] font-mono font-black text-[#00df82] uppercase tracking-[0.2em] block">MÓDULO EXPORTADOR SEGURO</span>
                <h3 className="text-lg font-black text-white text-center">{language === 'es' ? '¡Bucle Sincronizado!' : 'Loop Compiled Successfully!'}</h3>
                <p className="text-[11.5px] text-gray-400 leading-relaxed text-center">
                  Tu composición de 15 segundos con relación `{aspectRatio}` ha sido masterizada y resguardada con éxito.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setIsExportDone(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-black uppercase border border-white/5 cursor-pointer text-center"
                >
                  {language === 'es' ? 'Editar Más' : 'Edit Loop'}
                </button>
                <button
                  onClick={() => {
                    setIsExportDone(false);
                    setPlacedStickers([]);
                    setPlacedTexts([]);
                    setAutoSubtitlesEnabled(false);
                    setSelectedTrack(null);
                    if (onNavigateBack) onNavigateBack();
                  }}
                  className="flex-1 py-2.5 bg-[#2A85FF] hover:bg-[#1A75FF] text-white rounded-lg text-xs font-black uppercase text-center shadow-lg hover:brightness-110 cursor-pointer"
                >
                  {language === 'es' ? 'Ir al Feed 🚀' : 'Go to Feed 🚀'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
