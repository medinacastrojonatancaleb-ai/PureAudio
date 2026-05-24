import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Phone, VideoCircle, MessageSquare, Volume2, Mic, Play, Pause,
  Image, Smile, Search, Sparkles, ChevronLeft, Music, ExternalLink, UserCheck
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface FriendChat {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  lastMsg: string;
  time: string;
}

interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
  audioDuration?: string;
  sharedSong?: {
    title: string;
    artist: string;
    thumbnail: string;
  };
}

const CONTEXT_REPLY_MAP: Record<string, string> = {
  'hola': '¡Hey! Todo bien. ¿Qué tal estás vibrando hoy con la app?',
  'hello': 'Hey! Doing good. What deep synth or acoustic are you coding to right now?',
  'live': '¡Síii! Organicemos un Live grupal mañana en la noche para hacer unas rolas acústicas.',
  'music': 'Totalmente de acuerdo, la música de Ed Maverick cura cualquier alma cansada.',
  'racha': '¡Mantenme la racha de fuego 🔥! No dejes apagar ese feed que tenemos juntos.',
  'vibe': 'Esta aura neón de VibeSonic es de otro planeta, parece un entorno cyberpunk.'
};

export default function ChatScreen() {
  const { playTrack, t, language } = usePlayer();
  const [selectedFriend, setSelectedFriend] = useState<FriendChat | null>(null);
  const [chats, setChats] = useState<FriendChat[]>([
    { id: 'c1', name: 'Kevin Kaarl', avatar: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=150&q=80', online: true, lastMsg: '¡Mantenme la racha de fuego en tu social feed! 🔥', time: '12m' },
    { id: 'c2', name: 'Ed Maverick', avatar: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=150&q=80', online: true, lastMsg: 'Súper cover de Colapso, me llegó fuerte', time: '1h' },
    { id: 'c3', name: 'Santiago_99', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', online: false, lastMsg: 'Escucha este track, combina perfecto con lluvia', time: '1d' },
    { id: 'c4', name: 'Luna_Vibes', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', online: true, lastMsg: 'Mándame un mensaje de voz plss ✨', time: '2d' }
  ]);

  const [messageStream, setMessageStream] = useState<Record<string, ChatMessage[]>>({
    'c1': [
      { id: '1', sender: 'them', text: '¡Hola Sandra! Qué gran diseño estás logrando en VibeSonic.', time: '10:30 AM' },
      { id: '2', sender: 'me', text: 'Hey Kevin, ¡muchas gracias! La comunidad está creciendo.', time: '10:32 AM' },
      { id: '3', sender: 'them', text: '¡Mantenme la racha de fuego en tu social feed! 🔥', time: '10:33 AM' }
    ],
    'c2': [
      { id: '1', sender: 'them', text: '¿Llegaron bien los arreglos líricos de Colapso para el Sync?', time: '9:15 AM' },
      { id: '2', sender: 'me', text: '¡Súper exactos! Tus letras sincronizadas se ven perfectamente exactas.', time: '9:18 AM' }
    ],
    'c3': [
      { id: '1', sender: 'them', text: 'Escucha este track, combina perfecto con lluvia', time: 'Yesterday' },
      { id: '2', sender: 'them', text: 'Espero te guste', time: 'Yesterday', sharedSong: { title: 'Fuentes de Ortiz', artist: 'Ed Maverick', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=120&q=80' } }
    ],
    'c4': [
      { id: '1', sender: 'them', text: 'Mándame un mensaje de voz plss ✨', time: '2 days ago' },
      { id: '2', sender: 'me', text: 'Audio note de Sandra para recargar energías:', time: '2 days ago', audioDuration: '0:14' }
    ]
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [idIndex, setIdIndex] = useState(1001);

  const streamEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedFriend, messageStream, isTyping]);

  // Audio note timer simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAudioPlaying) {
      interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            setIsAudioPlaying(null);
            return 0;
          }
          return prev + 8;
        });
      }, 300);
    } else {
      setAudioProgress(0);
    }
    return () => clearInterval(interval);
  }, [isAudioPlaying]);

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim() || !selectedFriend) return;

    const myMsg: ChatMessage = {
      id: `msg-${idIndex}`,
      sender: 'me',
      text: textToSend.trim(),
      time: 'Just now'
    };
    setIdIndex(prev => prev + 1);

    setMessageStream(prev => ({
      ...prev,
      [selectedFriend.id]: [...(prev[selectedFriend.id] || []), myMsg]
    }));

    setInputText('');

    // Launch smart response automated timer
    setIsTyping(true);

    const matchKey = Object.keys(CONTEXT_REPLY_MAP).find(key => 
      textToSend.toLowerCase().includes(key)
    );
    const replyText = matchKey 
      ? CONTEXT_REPLY_MAP[matchKey] 
      : `¡Ufff, totalmente! Let's jam soon on a Live, la racha 🔥 sigue arriba.`;

    setTimeout(() => {
      setIsTyping(false);
      const guestReply: ChatMessage = {
        id: `reply-${idIndex + 1}`,
        sender: 'them',
        text: replyText,
        time: 'Just now'
      };
      setIdIndex(prev => prev + 2);

      setMessageStream(prev => ({
        ...prev,
        [selectedFriend.id]: [...(prev[selectedFriend.id] || []), guestReply]
      }));

      // Update last message in the dashboard side
      setChats(prev => prev.map(c => {
        if (c.id === selectedFriend.id) {
          return { ...c, lastMsg: replyText, time: 'Just now' };
        }
        return c;
      }));

    }, 2200);
  };

  const shareSongDirectly = () => {
    if (!selectedFriend) return;
    const song = {
      title: 'Acurrucar',
      artist: 'Ed Maverick',
      thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=150&q=80'
    };

    const myMsg: ChatMessage = {
      id: `share-${idIndex}`,
      sender: 'me',
      text: 'Te comparto esta joyita de rola 🎧:',
      time: 'Just now',
      sharedSong: song
    };
    setIdIndex(prev => prev + 1);

    setMessageStream(prev => ({
      ...prev,
      [selectedFriend.id]: [...(prev[selectedFriend.id] || []), myMsg]
    }));
  };

  // Quick feedback templates
  const presets = [
    "🔥 ¡Temón!", 
    "🎧 Sube la racha", 
    "🎸 Hagamos un Live!"
  ];

  if (selectedFriend) {
    const friendMessages = messageStream[selectedFriend.id] || [];

    return (
      <div className="h-[calc(100vh-140px)] md:h-[750px] relative w-full bg-[#030303] rounded-3xl overflow-hidden border border-white/5 flex flex-col md:max-w-md mx-auto shadow-2xl justify-between">
        
        {/* Chat Active Header */}
        <header className="p-4 border-b border-white/5 bg-[#0b0c10] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setSelectedFriend(null)}
              className="text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="relative">
              <img src={selectedFriend.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />
              {selectedFriend.online && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#0b0c10]" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-black text-white">{selectedFriend.name}</h4>
              <p className="text-[9px] text-[#00df82] font-semibold flex items-center gap-1">
                {isTyping ? (
                  <span className="animate-pulse">{language === 'es' ? 'Escribiendo...' : 'Typing...'}</span>
                ) : selectedFriend.online ? (
                  <span>online</span>
                ) : (
                  <span className="text-gray-500">offline</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 cursor-pointer">
              <Phone size={14} />
            </div>
          </div>
        </header>

        {/* Message Bubble Thread Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-hide relative bg-gradient-to-b from-black/20 to-black/60">
          <AnimatePresence initial={false}>
            {friendMessages.map((msg) => {
              const isMe = msg.sender === 'me';
              
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}
                >
                  <div className={`max-w-[80%] rounded-[20px] p-3.5 text-xs relative ${
                    isMe 
                      ? 'bg-primary text-black rounded-tr-sm font-semibold' 
                      : 'bg-white/5 text-white/95 border border-white/5 rounded-tl-sm'
                  }`}>
                    {/* Plain Text message */}
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {/* Shared Music Card in bubble */}
                    {msg.sharedSong && (
                      <div 
                        onClick={() => playTrack({
                          id: '',
                          title: msg.sharedSong!.title,
                          artist: msg.sharedSong!.artist,
                          thumbnail: msg.sharedSong!.thumbnail
                        })}
                        className={`mt-2.5 border p-2 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                          isMe 
                            ? 'bg-black/10 border-black/15 text-black hover:bg-black/20' 
                            : 'bg-[#12141c] border-white/5 text-white hover:border-primary/20'
                        }`}
                      >
                        <img src={msg.sharedSong.thumbnail} alt="" className="w-9 h-9 rounded object-cover shadow" />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-black text-[10px] leading-tight truncate">{msg.sharedSong.title}</h5>
                          <p className={`text-[8.5px] leading-none mt-1 truncate ${isMe ? 'text-black/60' : 'text-gray-500'}`}>{msg.sharedSong.artist}</p>
                        </div>
                        <Play size={15} fill="currentColor" />
                      </div>
                    )}

                    {/* Interactive Voice Mail visualizer bubble */}
                    {msg.audioDuration && (
                      <div className="mt-2 text-white flex items-center gap-3 bg-black/40 border border-white/5 p-2 rounded-xl min-w-[140px]">
                        <button 
                          type="button"
                          onClick={() => setIsAudioPlaying(isAudioPlaying === msg.id ? null : msg.id)}
                          className="w-7 h-7 bg-primary text-black rounded-full flex items-center justify-center cursor-pointer"
                        >
                          {isAudioPlaying === msg.id ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                        </button>
                        <div className="flex-1 space-y-1">
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${isAudioPlaying === msg.id ? audioProgress : 0}%` }} 
                            />
                          </div>
                          <span className="text-[8.5px] font-mono text-gray-400 font-bold leading-none block">{msg.audioDuration}</span>
                        </div>
                        <Volume2 size={13} className="text-gray-500 animate-pulse" />
                      </div>
                    )}

                    <span className={`block text-[8px] mt-1.5 text-right opacity-60 ${isMe ? 'text-neutral-800' : 'text-gray-500'} font-bold`}>
                      {msg.time}
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {/* Smart simulated writing delay bubble */}
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start w-full"
              >
                <div className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={streamEndRef} />
        </div>

        {/* Rapid Presets fast tags bar */}
        <div className="bg-[#0b0c10] border-t border-white/5 p-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => handleSendMessage(p)}
              className="bg-[#12141d]/80 border border-white/10 hover:border-primary/40 px-3 py-1.5 rounded-full text-[9.5px] font-black uppercase text-white hover:text-primary transition-colors flex-shrink-0 cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat input keyboard sender footer bar */}
        <div className="p-3 bg-[#0b0c10] flex items-center gap-2.5 border-t border-white/10 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button 
            onClick={shareSongDirectly}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white"
            title="Share current song template"
          >
            <Music size={15} />
          </button>
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
            placeholder={language === 'es' ? "Escribe un mensaje..." : "Type text or prompt..."}
            className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/25 placeholder:text-gray-500 text-white"
          />
          <button 
            onClick={() => handleSendMessage(inputText)}
            className="w-10 h-10 bg-primary rounded-xl text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Send size={15} />
          </button>
        </div>

      </div>
    );
  }

  // General inbox overview
  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto">
      
      {/* Search and spark index title */}
      <div className="flex justify-between items-center bg-[#0b0c0f]/80 backdrop-blur-2xl border border-white/5 px-4 py-3 rounded-2xl shadow-lg">
        <h3 className="text-sm font-black tracking-widest text-[#00df82] uppercase flex items-center gap-1.5"><Sparkles size={14} className="animate-pulse" /> VibeChat INBOX</h3>
        <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary uppercase font-bold tracking-tight px-2 py-0.5 rounded-full">Secure</span>
      </div>

      {/* List of inbox chats */}
      <div className="bg-[#0b0c0f]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-3.5 shadow-xl space-y-1.5">
        {chats.map((chat) => (
          <div 
            key={chat.id}
            onClick={() => setSelectedFriend(chat)}
            className="flex items-center justify-between p-3 rounded-2xl bg-black/25 hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <img src={chat.avatar} alt="" className="w-11 h-11 rounded-full object-cover border border-white/10 group-hover:scale-105 transition-transform" />
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-[#0b0c0a] animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white leading-tight">{chat.name}</h4>
                <p className="text-[10.5px] text-gray-500 truncate mt-1 max-w-[200px] leading-tight font-medium">
                  {chat.lastMsg}
                </p>
              </div>
            </div>

            <div className="text-right space-y-2 flex-shrink-0">
              <span className="text-[8.5px] text-gray-600 font-mono font-bold uppercase">{chat.time} ago</span>
              <div className="w-1.5 h-1.5 bg-primary rounded-full ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
