import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Mic, MicOff, MessageSquare, Heart, Sparkles, Send, Play, Hand, 
  Tv2, ArrowLeft, PlusCircle, ArrowUp, Check, Headphones, Award, Radio, 
  Smile, Gift, Database, Sparkle
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { youtubeService, YouTubeTrack } from '../services/youtubeService';

interface MusicRoom {
  id: string;
  name: string;
  genre: string;
  subTitle: string;
  viewers: number;
  currentTrack: YouTubeTrack;
  image: string;
}

interface RoomChat {
  id: string;
  user: string;
  avatar: string;
  text: string;
  color: string;
}

interface QueueItem {
  id: string;
  title: string;
  artist: string;
  votes: number;
  thumbnail: string;
  by: string;
}

const STATIC_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=60&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=60&q=80"
];

const ROOM_CHATS_LIBRARY = [
  "¡Me encanta esta pista para programar de noche! 💻☕",
  "Por favor coloquen Kevin Kaarl después, tiene una vibra increíble",
  "¿Alguien tiene el link de la lista de reproducción oficial?",
  "Esta sala tiene la mejorlatencia acústica, se escucha idéntico 😍",
  "Súbanle al volumen en la transicióon!",
  "¡Votado! Esa canción tiene que estar en el top ya mismo 🔥",
  "¿Puedo tomar la palabra por micrófono?",
  "Uff me relajé por completo con este Lofi, qué buen mood",
  "Amo la estética violeta de este reproductor",
  "¡Sandra colocó un temazo! Graaaacias de verdad ✨🎧"
];

export default function MusicRoomsScreen({ onClose }: { onClose?: () => void }) {
  const { language, playTrack } = usePlayer();
  const [activeRoom, setActiveRoom] = useState<MusicRoom | null>(null);
  
  // Audio state
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [progressVal, setProgressVal] = useState(35); // simulated percent
  const [chatMessages, setChatMessages] = useState<RoomChat[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Track queuing and voting subsystem
  const [roomQueue, setRoomQueue] = useState<QueueItem[]>([]);
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Simulated Voice active indicators
  const [talkingUsers, setTalkingUsers] = useState<Record<string, boolean>>({});

  // Floating reactions container
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; char: string; left: number }[]>([]);

  // Rooms Seed Data
  const [availableRooms, setAvailableRooms] = useState<MusicRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // Generate dynamic rooms using reliable trending seed
  useEffect(() => {
    async function initRooms() {
      setIsLoadingRooms(true);
      try {
        const trending = await youtubeService.getTrending();
        const fallbackTrack = {
          id: "jfKfPfyJRdk",
          title: "lofi hip hop radio - beats to relax/study to",
          artist: "Lofi Girl",
          thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
          duration: "LIVE"
        };

        const rooms: MusicRoom[] = [
          {
            id: 'lofi-beats',
            name: language === 'es' ? 'Café Lo-Fi Nocturno' : 'Nightly Lo-Fi Cafe',
            genre: 'Lofi / Ambient Focus',
            subTitle: 'Beats lentos ideales para leer, programar o estudiar.',
            viewers: 142,
            currentTrack: trending[3] || fallbackTrack,
            image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=300&q=80'
          },
          {
            id: 'reggaeton-wave',
            name: language === 'es' ? 'Pre-Party Eléctrico' : 'Electric Neon Perreo',
            genre: 'Reggaetón / Urbano',
            subTitle: 'Sonidos pesados del callejón, trap y clásicos calientes.',
            viewers: 289,
            currentTrack: trending[0] || fallbackTrack,
            image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80'
          },
          {
            id: 'sad-acoustics',
            name: language === 'es' ? 'Estación Melancólica' : 'Late Acoustic Melancholy',
            genre: 'Sad Indie / Bedroom Pop',
            subTitle: 'Guitarras íntimas, lamento folk y melodías rotas.',
            viewers: 95,
            currentTrack: trending[1] || fallbackTrack,
            image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80'
          },
          {
            id: 'rock-garage',
            name: language === 'es' ? 'Garaje Rock Distorsión' : 'Fuzz Distortion Garage',
            genre: 'Fuzz / Alt Rock',
            subTitle: 'Riffs rasposos, baterías de metal e himnos de estadio.',
            viewers: 120,
            currentTrack: trending[5] || fallbackTrack,
            image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=300&q=80'
          }
        ];

        setAvailableRooms(rooms);
      } catch (err) {
        console.warn('Error fetching track list seed for rooms:', err);
      } finally {
        setIsLoadingRooms(false);
      }
    }
    initRooms();
  }, [language]);

  const triggerFloatingReaction = (emoji: string) => {
    setFloatingEmojis(prev => [
      ...prev,
      { id: Math.random(), char: emoji, left: Math.floor(Math.random() * 60) + 20 }
    ]);
  };

  // Handle active room cyclical simulation loops
  useEffect(() => {
    if (!activeRoom) return;

    // Reset components states
    setChatMessages([
      { id: '1', user: 'Santiago_Dev', avatar: STATIC_AVATARS[0], text: language === 'es' ? '¡Qué buen tempo tiene esta pista coordinada!' : 'Tremendous acoustic coordinates here!', color: 'text-cyan-400' },
      { id: '2', user: 'Luna_Rosa', avatar: STATIC_AVATARS[1], text: language === 'es' ? '¡Sí! Alguien ponga un temazo alternativo después 💫' : 'Exactly! Somebody upvote an indie acoustic track next.', color: 'text-pink-400' }
    ]);

    // Initial dummy queue seed based on active room genre
    setRoomQueue([
      { id: 'q1', title: 'Fuentes de Ortiz', artist: 'Ed Mavericks', votes: 14, thumbnail: 'https://i.ytimg.com/vi/7d_oSTrLpRE/hqdefault.jpg', by: 'Juan_98' },
      { id: 'q2', title: 'San Lucas', artist: 'Kevin Kaarl', votes: 8, thumbnail: 'https://i.ytimg.com/vi/gJnQX-87-hs/hqdefault.jpg', by: 'Sandra_Dev' }
    ]);

    // Simulated play progression & chatting loop
    const subTimer = setInterval(() => {
      setProgressVal(prev => (prev >= 100 ? 0 : prev + 1.2));

      // Append random message reactions
      if (Math.random() > 0.45) {
        const randomUser = 'OndaSónica_' + Math.floor(Math.random() * 800 + 100);
        const randomAvatar = STATIC_AVATARS[Math.floor(Math.random() * STATIC_AVATARS.length)];
        const randomText = ROOM_CHATS_LIBRARY[Math.floor(Math.random() * ROOM_CHATS_LIBRARY.length)];
        const colors = ['text-primary', 'text-cyan-400', 'text-pink-400', 'text-yellow-400', 'text-purple-400'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        setChatMessages(prev => [
          ...prev.slice(-15),
          { id: Math.random().toString(), user: randomUser, avatar: randomAvatar, text: randomText, color: randomColor }
        ]);
      }

      // Randomly display user "speaking" indicator glowing green
      const randomSpeaker = `speaker-${Math.floor(Math.random() * 4)}`;
      setTalkingUsers(prev => ({ ...prev, [randomSpeaker]: true }));
      setTimeout(() => {
        setTalkingUsers(prev => ({ ...prev, [randomSpeaker]: false }));
      }, 1500);

      // Auto floating emojis
      if (Math.random() > 0.6) {
        const emojis = ['❤️', '🔥', '🎉', '🎧', '⚡'];
        triggerFloatingReaction(emojis[Math.floor(Math.random() * emojis.length)]);
      }

    }, 3900);

    return () => clearInterval(subTimer);
  }, [activeRoom]);

  const handleSendRoomChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        user: 'Sandra_Dev (Tú)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        text: chatInput,
        color: 'text-[#00df82] font-black'
      }
    ]);
    setChatInput('');
    triggerFloatingReaction('🔥');
  };

  // Upvote queue tracks
  const handleVoteQueue = (id: string) => {
    setRoomQueue(prev => 
      prev.map(q => q.id === id ? { ...q, votes: q.votes + 1 } : q)
      .sort((a, b) => b.votes - a.votes)
    );
    triggerFloatingReaction('⚡');
  };

  // Search tracks to append to queue
  const handleSearchQueueTracks = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await youtubeService.getPlayableTracks(searchQuery);
      setSearchResults(results.slice(0, 5));
    } catch (e) {
      console.warn('Queue search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePushToQueue = (track: YouTubeTrack) => {
    const newItem: QueueItem = {
      id: `custom-q-${track.id}-${roomQueue.length}`,
      title: track.title,
      artist: track.artist,
      votes: 1,
      thumbnail: track.thumbnail,
      by: 'Sandra_Dev'
    };
    setRoomQueue(prev => [...prev, newItem].sort((a,b) => b.votes - a.votes));
    setIsAddingTrack(false);
    setSearchQuery('');
    setSearchResults([]);
    triggerFloatingReaction('➕');
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white">
      
      {/* BROWSE ALL ACTIVE ROOMS VIEW */}
      {!activeRoom ? (
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-6">
          
          {/* Header row */}
          <div className="flex justify-between items-center shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Radio className="text-primary animate-pulse w-5 h-5" />
                <span className="text-[10px] font-mono font-black text-primary uppercase tracking-widest">MULTIVERSE SYNCED</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {language === 'es' ? 'Salas Musicales' : 'Music Party Rooms'}
              </h1>
              <p className="text-xs text-gray-400 font-medium">
                {language === 'es' ? 'Sintoniza y escucha en directo con miles de melómanos alrededor del mundo.' : 'Listen cooperatively, voice chat, and vote together.'}
              </p>
            </div>

            {onClose && (
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
            )}
          </div>

          {isLoadingRooms ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-primary">SINTONIZANDO SEÑALES...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {availableRooms.map((room) => (
                <motion.div
                  key={room.id}
                  whileHover={{ y: -4 }}
                  className="bg-[#0b0c10]/95 border border-white/5 hover:border-primary/20 rounded-[28px] overflow-hidden shadow-2xl flex flex-col justify-between"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img src={room.image} alt={room.name} className="w-full h-full object-cover brightness-95" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    
                    {/* Live viewer count badge overlay */}
                    <div className="absolute top-4 left-4 bg-red-500 text-black font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />
                      <span>LIVE • {room.viewers} {language === 'es' ? 'oyentes' : 'users'}</span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-left">
                      <span className="text-[9px] font-mono font-black text-primary uppercase tracking-widest">{room.genre}</span>
                      <h3 className="text-lg font-black text-white mt-1 leading-none">{room.name}</h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 text-left flex-1 flex flex-col justify-between">
                    <p className="text-xs text-gray-400 font-medium leading-relaxed">{room.subTitle}</p>

                    <div className="bg-black/30 border border-white/5 rounded-2xl p-3 flex items-center gap-3">
                      <img src={room.currentTrack.thumbnail} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[8px] font-mono font-black text-gray-500 uppercase tracking-wider block">REPRODUCIENDO COOPERATIVO:</span>
                        <h4 className="text-xs font-black text-white truncate leading-snug mt-0.5">{room.currentTrack.title}</h4>
                        <p className="text-[9px] text-primary truncate leading-none mt-0.5">{room.currentTrack.artist}</p>
                      </div>
                      <Headphones size={15} className="text-gray-500 shrink-0 animate-bounce" />
                    </div>

                    <button
                      onClick={() => {
                        setActiveRoom(room);
                        // Trigger immediate playback on player if user selects
                        playTrack(room.currentTrack, [room.currentTrack]);
                      }}
                      className="w-full py-3 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-2xl shadow-lg shadow-primary/10 hover:scale-102 active:scale-98 transition-all cursor-pointer text-center"
                    >
                      {language === 'es' ? 'Sintonizar Sala' : 'Join Acoustic Session'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Prompt to create custom room banner */}
          <div className="bg-gradient-to-r from-primary/10 via-[#00cbff]/5 to-[#ff2e54]/5 border border-primary/20 rounded-[32px] p-6 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-black text-primary uppercase tracking-wider">CREATIVIDAD COOPERATIVA</span>
              <h3 className="text-xl font-black text-white">{language === 'es' ? '¿Quieres Hostear tu Propia Sala?' : 'Create Your Custom Venue'}</h3>
              <p className="text-xs text-gray-400 leading-normal">
                Configura tu espectro aura, invita amigos por chat privado, modera tu micrófono y voten canciones.
              </p>
            </div>
            <button className="bg-white/10 hover:bg-white/15 px-6 py-3 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all text-center">
              + {language === 'es' ? 'HOSTEAR NUEVO LIVE' : 'HOST LIVE'}
            </button>
          </div>
        </div>
      ) : (
        
        /* COOPERATIVE INTERACTIVE ROOM MAIN HUD */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

          {/* Floating reactions particles layer */}
          <div className="absolute inset-x-0 bottom-40 top-0 pointer-events-none z-10 overflow-hidden">
            <AnimatePresence>
              {floatingEmojis.map((emoji) => (
                <motion.div
                  key={emoji.id}
                  initial={{ y: '100%', x: `${emoji.left}%`, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: [0, 1, 1, 0], scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 3.5, ease: 'easeOut' }}
                  className="absolute text-5xl"
                >
                  {emoji.char}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* LEFT CHUNKS PANEL: Album, Waveform and Cooperative Voice Indicators */}
          <div className="flex-1 bg-black/40 border-r border-white/5 p-4 flex flex-col justify-between overflow-y-auto max-h-[55vh] md:max-h-none select-none">
            
            <button 
              onClick={() => setActiveRoom(null)}
              className="flex items-center gap-1.5 text-xs font-black text-gray-450 hover:text-white transition-colors cursor-pointer self-start my-1 border border-white/5 px-3 py-1.5 bg-black/30 rounded-xl"
            >
              ← {language === 'es' ? 'Volver a Salas' : 'Exit Lounge'}
            </button>

            {/* Central Immersive Area */}
            <div className="my-auto py-5 space-y-6 flex flex-col items-center">
              
              {/* Dynamic Album Frame */}
              <div 
                onClick={() => triggerFloatingReaction('🔥')}
                className="w-40 h-40 md:w-52 md:h-52 rounded-[36px] overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.7)] relative group cursor-pointer ring-1 ring-white/15 hover:scale-103 transition-transform"
              >
                <img src={activeRoom.currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-black">
                    <Heart size={24} fill="currentColor" />
                  </div>
                </div>
              </div>

              {/* Title rows */}
              <div className="text-center space-y-1.5 max-w-sm">
                <div className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-500 font-mono font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  SINTONIZADOS COOPERATIVOS
                </div>
                <h2 className="text-xl font-black text-white line-clamp-1">{activeRoom.currentTrack.title}</h2>
                <p className="text-xs font-bold text-primary">{activeRoom.currentTrack.artist}</p>
              </div>

              {/* Cooperative Volume Progress bars */}
              <div className="w-full max-w-xs space-y-2 text-left">
                <div className="flex justify-between text-[10px] font-mono text-gray-500 font-bold">
                  <span>SINCRONIZACIÓN DE RED: 0.1ms</span>
                  <span>{Math.floor(progressVal)}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/[0.03] p-[1px]">
                  <div className="h-full bg-gradient-to-r from-primary via-[#00cbff] to-[#ff2e54] rounded-full transition-all duration-1000" style={{ width: `${progressVal}%` }} />
                </div>
              </div>
            </div>

            {/* COOPERATIVE VOICE CALLING INDICATORS ROW */}
            <div className="bg-black/30 border border-white/5 rounded-[24px] p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9.5px] font-mono font-black text-gray-400 uppercase tracking-widest block">CANAL DE VOZ DIRECTO ({Object.keys(talkingUsers).length + 1} ONLINE)</span>
                <button 
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`p-2.5 rounded-full cursor-pointer transition-all ${
                    isMicMuted ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-[#00df82]/10 text-[#00df82] border border-[#00df82]/20 shadow-[0_0_15px_rgba(3,221,130,0.3)] animate-pulse'
                  }`}
                >
                  {isMicMuted ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                {/* Active user */}
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-full p-[2px] cursor-pointer">
                    <div className={`absolute inset-0 rounded-full transition-all ${!isMicMuted ? 'bg-primary animate-pulse' : 'bg-white/10'}`} />
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
                      alt="" className="w-full h-full object-cover rounded-full relative z-10 border border-black" 
                    />
                    {!isMicMuted && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary text-black font-black text-[8px] rounded-full flex items-center justify-center border border-black select-none z-20">🎙️</span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-white truncate max-w-[80px]">Sandra (Tú)</p>
                    <p className="text-[8px] font-mono font-extrabold text-gray-400">{isMicMuted ? 'MUTEADO' : 'HABLANDO'}</p>
                  </div>
                </div>

                {/* Simulated friends speakers indicators */}
                {[
                  { name: 'Santiago', id: 'speaker-0', avatar: STATIC_AVATARS[0] },
                  { name: 'Luna_R', id: 'speaker-1', avatar: STATIC_AVATARS[1] },
                  { name: 'Camilo_F', id: 'speaker-2', avatar: STATIC_AVATARS[2] },
                  { name: 'Ester_G', id: 'speaker-3', avatar: STATIC_AVATARS[3] }
                ].map((spk, idx) => {
                  const isTalking = talkingUsers[spk.id] || false;
                  return (
                    <div key={spk.id} className="flex items-center gap-2 opacity-80">
                      <div className="relative w-10 h-10 rounded-full p-[2px]">
                        <div className={`absolute inset-0 rounded-full transition-all ${isTalking ? 'bg-primary scale-105 animate-ping' : 'bg-transparent'}`} />
                        <div className={`absolute inset-0 rounded-full transition-all ${isTalking ? 'bg-[#00df82]' : 'bg-white/5'}`} />
                        <img src={spk.avatar} alt="" className="w-full h-full object-cover rounded-full relative z-10 border border-black" />
                      </div>
                      <div className="text-left hidden xs:block">
                        <p className="text-[10px] font-black text-white truncate max-w-[65px]">{spk.name}</p>
                        <p className={`text-[8.5px] font-bold font-mono uppercase ${isTalking ? 'text-primary' : 'text-gray-500'}`}>{isTalking ? 'TALKING' : 'SILENT'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT CHUNKS PANEL: Live Chat & Collaborative Playlist Queue upvoting */}
          <div className="w-full md:w-[360px] bg-[#0c0f14] overflow-y-auto flex flex-col shrink-0 select-none border-l border-white/5">
            
            {/* Cooperative Queue Box */}
            <div className="p-4 border-b border-white/5 space-y-3.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">
                  <Headphones size={12} className="text-primary animate-pulse" />
                  <span>PLAYLIST COOPERATIVA ({roomQueue.length})</span>
                </div>
                <button
                  onClick={() => setIsAddingTrack(true)}
                  className="p-1 text-primary hover:text-[#00cbff] transition-colors flex items-center gap-1 text-[10px] uppercase font-black tracking-wider cursor-pointer"
                >
                  <PlusCircle size={14} /> Add
                </button>
              </div>

              {/* Queue Items Loop */}
              <div className="space-y-2">
                {roomQueue.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className="bg-black/30 border border-white/5 rounded-xl p-2 flex items-center gap-3"
                  >
                    <div className="w-4.5 h-4.5 rounded bg-white/5 text-[9px] font-mono text-gray-500 font-bold flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <img src={item.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover shadow" />
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-[11px] font-black text-white truncate leading-none">{item.title}</h4>
                      <p className="text-[9px] text-gray-500 truncate mt-1 leading-none">{item.artist}</p>
                    </div>

                    <button
                      onClick={() => handleVoteQueue(item.id)}
                      className="p-1 px-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary font-black text-[9px] flex items-center gap-1 hover:scale-102 active:scale-98 transition-all cursor-pointer"
                    >
                      <ArrowUp size={10} />
                      <span>{item.votes}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Live Chat Comments */}
            <div className="flex-1 flex flex-col p-4 justify-between min-h-[250px]">
              <span className="text-[9.5px] font-mono font-black text-gray-400 uppercase tracking-widest block text-left mb-2">CHAT DE LA SALA:</span>
              
              <div className="flex-1 overflow-y-auto space-y-3.5 max-h-56 pr-1 text-left scrollbar-thin">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2 text-xs">
                    <img src={msg.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0" />
                    <div className="flex-1">
                      <span className={`text-[10px] font-extrabold block ${msg.color}`}>{msg.user}</span>
                      <p className="text-gray-300 font-medium leading-relaxed mt-0.5">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Send Form */}
              <form onSubmit={handleSendRoomChat} className="flex items-center gap-2 bg-black/40 border border-white/5 hover:border-primary/40 rounded-xl px-2.5 py-1.5 focus-within:border-primary transition-all mt-4">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={language === 'es' ? 'Enviar un mensaje cooperativo...' : 'Type a room message...'}
                  className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none placeholder:text-gray-500 py-1"
                />
                <button 
                  type="submit"
                  className="w-8 h-8 rounded-lg bg-primary hover:bg-[#00eaae] text-black flex items-center justify-center shadow-lg cursor-pointer"
                >
                  <Send size={12} fill="currentColor" />
                </button>
              </form>
            </div>
          </div>

          {/* ADD SONG TO COOPERATIVE QUEUE PANEL MODAL */}
          <AnimatePresence>
            {isAddingTrack && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[130] p-4 pointer-events-auto">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-[#0f1118] border border-white/10 rounded-[28px] p-6 max-w-sm w-full space-y-5 text-left shadow-3xl text-white"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-lg text-white tracking-tight">Votar Nueva Canción</h3>
                    <button 
                      onClick={() => setIsAddingTrack(false)}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>

                  <p className="text-xs text-gray-400">
                    Propón canciones para el listado cooperativo. Los oyentes votarán para subirlas al reproductor principal.
                  </p>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por título o artista..."
                        className="flex-1 bg-black/40 border border-white/10 px-3 py-2 text-xs rounded-xl focus:border-primary focus:outline-none text-white placeholder:text-gray-550"
                      />
                      <button 
                        onClick={handleSearchQueueTracks}
                        className="bg-primary text-black font-black text-xs uppercase px-4 rounded-xl hover:brightness-110 active:scale-95 cursor-pointer"
                      >
                        Buscar
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <div className="py-8 flex flex-col items-center gap-2 text-gray-550 text-[10px]">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span>PROPAGANDO SEÑALES...</span>
                        </div>
                      ) : (
                        searchResults.map((track) => (
                          <div 
                            key={track.id}
                            onClick={() => handlePushToQueue(track)}
                            className="bg-white/5 hover:bg-white/10 p-2 rounded-xl flex items-center gap-3 cursor-pointer border border-white/5 transition-all text-left group"
                          >
                            <img src={track.thumbnail} className="w-8 h-8 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-black truncate leading-none text-white group-hover:text-primary">{track.title}</h4>
                              <p className="text-[9px] text-gray-550 truncate mt-1 leading-none">{track.artist}</p>
                            </div>
                            <span className="text-[9px] font-black uppercase text-primary border border-primary/20 bg-primary/10 px-2 py-1 rounded-sm">
                              ELEGIR
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
