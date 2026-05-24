import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, Users, Heart, Gift, Volume2, UserPlus, PhoneCall, Radio, Mic,
  MessageSquare, Sparkles, Send, Award, HelpCircle, Ban, X, Play, Square, Smile
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface LiveGift {
  name: string;
  emoji: string;
  cost: number;
}

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  giftEmoji?: string;
  color: string;
}

const CONTEXT_CHATS = [
  "¡Qué gran vibra tiene este live! 😍🎸",
  "¿Ed Maverick vas a cantar fuentes de ortiz?",
  "Esta app corre súper fluida, me encanta el tema neón",
  "Sandra manda saludos a Colombia plsss! 🇨🇴✨",
  "¡Increíble improvisación de sonido en directo!",
  "Súbele un poquito al volumen de fondo 🔊🎶",
  "¿Puedo unirme al live por llamada de voz?",
  "¡Espectacular la racha de regalos de hoy!",
  "La latencia es de cero, gran trabajo de optimización backend",
  "Uff qué loco ese efecto de aplausos 😂😂😂"
];

const AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=60&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=60&q=80"
];

const COLORS = [
  "text-primary", "text-cyan-400", "text-yellow-400", "text-pink-400", "text-purple-400"
];

export default function LiveStreamScreen() {
  const { language } = usePlayer();
  const [isLive, setIsLive] = useState(true);
  const [viewers, setViewers] = useState(342);
  const [giftPoints, setGiftPoints] = useState(120);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user: 'Santiago_99',
      avatar: AVATARS[0],
      text: language === 'es' ? '¡Ese cover de Kevin Kaarl estuvo brutal!' : 'That Kevin Kaarl cover was magical!',
      color: COLORS[1]
    },
    {
      id: '2',
      user: 'Luna_Vibes',
      avatar: AVATARS[1],
      text: language === 'es' ? '¿Van a cantar de noche hoy?' : 'Are we playing midnight acoustics tonight?',
      color: COLORS[3]
    }
  ]);

  const [activeSoundEffect, setActiveSoundEffect] = useState<string | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: number }[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'calling' | 'joined'>('idle');
  const [joinedFriend, setJoinedFriend] = useState<string | null>(null);
  const [idIndex, setIdIndex] = useState(2001);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dynamic viewer oscillation and automated simulated chat reaction loop
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Oscilate viewers
      setViewers(prev => Math.max(10, prev + Math.floor(Math.random() * 15) - 7));
      
      // Auto append chat message reacting to the streamer
      const randomUser = 'Fan_' + Math.floor(Math.random() * 900 + 100);
      const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
      const randomText = CONTEXT_CHATS[Math.floor(Math.random() * CONTEXT_CHATS.length)];
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

      const rawMsg: ChatMessage = {
        id: Date.now().toString(),
        user: randomUser,
        avatar: randomAvatar,
        text: randomText,
        color: randomColor
      };

      setChatMessages(prev => [...prev.slice(-30), rawMsg]); // Keep last 30
      
      // Trigger floating hearts occasionally
      if (Math.random() > 0.4) {
        setFloatingHearts(prev => [...prev, { id: Date.now(), left: Math.floor(Math.random() * 60) + 20 }]);
      }

    }, 3800);

    return () => clearInterval(interval);
  }, [isLive]);

  // Scroll to bottom of simulation chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const triggerSoundEffect = (effect: string) => {
    setActiveSoundEffect(effect);
    
    // Simulate audio reaction logs in the live chat feed
    const sysMsg: ChatMessage = {
      id: `fx-${idIndex}`,
      user: 'STREAM_FX',
      avatar: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=60&q=80',
      text: `🎵 *Streamer activó el efecto especial: ${effect}!* 🎵`,
      color: 'text-primary'
    };
    setIdIndex(prev => prev + 1);
    setChatMessages(prev => [...prev, sysMsg]);

    setTimeout(() => {
      setActiveSoundEffect(null);
    }, 1500);
  };

  const sendGiftToLive = (gift: LiveGift) => {
    setGiftPoints(prev => prev + gift.cost);
    
    // Animate custom gift logs
    const giftMessage: ChatMessage = {
      id: `gift-${idIndex}`,
      user: 'Sandra_Dev',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      text: `${language === 'es' ? 'envió un elemento' : 'gifted a'} ${gift.name}!`,
      giftEmoji: gift.emoji,
      color: 'text-[#00df82]'
    };
    setIdIndex(prev => prev + 1);
    setChatMessages(prev => [...prev, giftMessage]);
    
    // Trigger burst of floating hearts
    const bursts = Array.from({ length: 4 }).map((_, i) => ({
      id: idIndex + 100 + i,
      left: Math.floor(Math.random() * 50) + 25
    }));
    setIdIndex(prev => prev + 5);
    setFloatingHearts(prev => [...prev, ...bursts]);

    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => !bursts.find(b => b.id === h.id)));
    }, 2000);
  };

  const handleFloatingHeartRemove = (id: number) => {
    setFloatingHearts(prev => prev.filter(h => h.id !== id));
  };

  const handleStartCallInvite = (friend: string) => {
    setInviteStatus('calling');
    setJoinedFriend(friend);
    setTimeout(() => {
      setInviteStatus('joined');
      
      // Notify chat that someone joined
      const joinedMsg: ChatMessage = {
        id: Date.now().toString(),
        user: friend,
        avatar: AVATARS[2],
        text: `🎙️ ¡Hola a todos! Acabo de unirme por llamada de voz al Live. Let's jam!`,
        color: 'text-cyan-400'
      };
      setChatMessages(prev => [...prev, joinedMsg]);
    }, 3000);
  };

  const giftsList: LiveGift[] = [
    { name: 'Coffee Cup', emoji: '☕', cost: 10 },
    { name: 'Gold Mic', emoji: '🎙️', cost: 50 },
    { name: 'Diamond Ring', emoji: '💎', cost: 150 },
    { name: 'Vibe Crown', emoji: '👑', cost: 500 }
  ];

  const soundboard: string[] = [
    'Aplausos 👏', 'Risas 😂', 'Bocina de Aire 🎺', 'Gasp 🤩'
  ];

  return (
    <div className="h-[calc(100vh-140px)] md:h-[750px] relative w-full bg-[#030303] rounded-3xl overflow-hidden border border-white/5 flex flex-col md:max-w-md mx-auto shadow-2xl justify-between">
      
      {/* Immersive Stream View Stage */}
      <div className="relative flex-1 bg-gradient-to-b from-[#12141c] to-[#040508] select-none flex flex-col overflow-hidden">
        
        {/* Dynamic camera background simulation (Gradient mimicking beautiful neon ambient streamer workspace) */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[20%] left-1/4 w-72 h-72 bg-[#00df82]/10 rounded-full blur-[90px] animate-pulse" />
          <div className="absolute bottom-[30%] right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px]" />
          
          {/* Futuristic camera HUD frame markers */}
          <div className="absolute inset-4 border border-white/5 pointer-events-none rounded-xl">
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-primary/40" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-primary/40" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-primary/40" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-primary/40" />
          </div>

          {/* Joined streamer picture inside overlay (Individual or Group mode) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isLive ? (
              <div className="w-full h-full flex flex-row items-center justify-center p-4 gap-2 transition-all">
                {/* Me */}
                <div className={`relative flex flex-col items-center justify-center overflow-hidden bg-black/40 border border-white/10 rounded-2xl ${
                  inviteStatus === 'joined' ? 'w-1/2 aspect-[9/16]' : 'w-[80%] aspect-[3/4]'
                } transition-all`}>
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
                    alt="Sandra" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary/50 shadow-2xl animate-pulse" 
                  />
                  <div className="absolute bottom-2 left-2 bg-black/40 text-[9px] px-2 py-0.5 rounded text-primary font-bold">SANDRA</div>
                </div>

                {/* Co-streamer joined */}
                {inviteStatus === 'calling' && (
                  <div className="w-1/2 aspect-[9/16] bg-black/60 border border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center text-center p-3 animate-pulse">
                    <PhoneCall size={20} className="text-cyan-400 animate-bounce mb-2" />
                    <span className="text-[10px] text-gray-400">{language === 'es' ? 'Llamando...' : 'Calling friend...'}</span>
                    <span className="text-xs font-black text-white mt-1">{joinedFriend}</span>
                  </div>
                )}

                {inviteStatus === 'joined' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-1/2 aspect-[9/16] relative flex flex-col items-center justify-center overflow-hidden bg-[#10141d] border-2 border-cyan-500/60 rounded-2xl shadow-xl"
                  >
                    <img 
                      src={AVATARS[2]} 
                      alt="" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400 animate-pulse" 
                    />
                    <div className="absolute bottom-2 left-2 bg-cyan-950/80 text-[9px] px-2 py-0.5 rounded text-cyan-400 font-bold flex items-center gap-1">
                      <Mic size={10} />
                      <span>{joinedFriend}</span>
                    </div>
                    {/* Disconnect indicator */}
                    <button 
                      onClick={() => { setInviteStatus('idle'); setJoinedFriend(null); }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 p-1.5 rounded-full text-white cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-neutral-900 border border-white/5 rounded-full flex items-center justify-center text-gray-500 mx-auto">
                  <Radio size={28} />
                </div>
                <h4 className="text-sm font-black text-white">{language === 'es' ? 'Transmisión Apagada' : 'Live Stream Inactive'}</h4>
                <p className="text-xs text-gray-500 max-w-[200px]">{language === 'es' ? 'Inicia la cámara para sintonizar en vivo.' : 'Power on camera to simulator live broadcast.'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Sound Effect announcement splash overlay */}
        <AnimatePresence>
          {activeSoundEffect && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="absolute top-28 left-4 right-4 bg-primary/20 backdrop-blur-md border border-primary/30 p-2.5 rounded-xl z-20 text-center flex items-center justify-center gap-1.5 shadow-xl shadow-primary/10"
            >
              <Volume2 className="text-primary animate-bounceWiggle" size={16} />
              <span className="text-xs font-black text-white uppercase tracking-wider">
                SoundFX: {activeSoundEffect}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Float Hearts upward path animator */}
        {floatingHearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ y: '100%', opacity: 1, x: heart.left * 3 }}
            animate={{ y: '-10%', opacity: 0, x: heart.left * 3 + Math.sin(heart.id) * 40 }}
            transition={{ duration: 3.5, ease: 'easeOut' }}
            onAnimationComplete={() => handleFloatingHeartRemove(heart.id)}
            className="absolute bottom-24 pointer-events-none z-10 text-red-500"
          >
            <Heart size={20} fill="currentColor" className="opacity-90 filter drop-shadow-[0_2px_8px_rgba(239,68,68,0.7)]" />
          </motion.div>
        ))}

        {/* HUD Overlay Details: Controls, viewers, points */}
        <div className="relative z-10 p-4 space-y-3 flex-1 flex flex-col justify-between pointer-events-none">
          
          {/* Top Info row */}
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-white font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded flex items-center gap-1.5 shadow-lg border border-red-400">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                Live
              </span>
              <span className="bg-black/40 backdrop-blur-md text-[10px] text-white px-2.5 py-1 rounded border border-white/5 flex items-center gap-1 font-mono font-bold">
                <Users size={11} className="text-primary" />
                {viewers.toLocaleString()}
              </span>
            </div>

            <div className="bg-black/40 backdrop-blur-md text-[10px] text-yellow-400 border border-yellow-400/20 px-2.5 py-1 rounded flex items-center gap-1.5 max-w-max font-mono font-bold shadow-md">
              <Award size={12} className="text-yellow-400 fill-current animate-pulse" />
              <span>{giftPoints} Donation Pts</span>
            </div>
          </div>

          {/* Infinite scrolling interactive chat on bottom inside the Stream view */}
          <div className="w-full max-h-[160px] overflow-y-auto space-y-1.5 flex flex-col scrollbar-hide pointer-events-auto mt-auto pr-8 py-3 bg-gradient-to-t from-black/80 to-transparent">
            {chatMessages.map((msg) => (
              <div 
                key={msg.id} 
                className="flex items-start gap-2.5 bg-black/25 backdrop-blur-sm self-start px-3 py-1.5 rounded-xl border border-white/[0.03] text-[11px] leading-relaxed max-w-[90%] whitespace-pre-wrap select-text shadow-sm"
              >
                <img src={msg.avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-white/5" />
                <div>
                  <span className={`font-black uppercase tracking-wider text-[9.5px] ${msg.color}`}>{msg.user}: </span>
                  <span className="text-white font-sans">{msg.text}</span>
                  {msg.giftEmoji && (
                    <span className="animate-bounce inline-block text-base ml-1">{msg.giftEmoji}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

        </div>

      </div>

      {/* Stream interactive action bottom-bar and audio control dashboard */}
      <div className="bg-[#0b0c0f] border-t border-white/10 p-4 space-y-4 z-20 pointer-events-auto">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-widest leading-none">Streamer Control Desk</span>
          <div className="flex gap-2">
            
            {/* Voicelink Invite list button */}
            <button 
              onClick={() => { if (isLive) setShowInviteModal(true); }}
              className={`p-2 rounded-xl text-white transition-all flex items-center gap-1 border ${
                inviteStatus === 'joined' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              title="Voice Invite"
            >
              <UserPlus size={14} />
              <span className="text-[9px] uppercase font-black tracking-wide">Invite</span>
            </button>

            {/* Toggle Camera broadcast simulator */}
            <button 
              onClick={() => setIsLive(!isLive)}
              className={`p-2 rounded-xl transition-all border ${
                isLive ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-primary text-black border-transparent'
              }`}
            >
              {isLive ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
            </button>
          </div>
        </div>

        {/* Sound FX soundboards trigger */}
        <div className="space-y-2">
          <span className="text-[9px] font-mono font-bold tracking-widest text-primary uppercase block leading-none">Comedic Soundboard SoundFX:</span>
          <div className="grid grid-cols-4 gap-2">
            {soundboard.map((fx) => (
              <button
                key={fx}
                onClick={() => isLive && triggerSoundEffect(fx)}
                disabled={!isLive}
                className="bg-black border border-white/10 hover:border-primary/40 disabled:opacity-30 disabled:border-white/5 rounded-xl py-2 px-1 text-center text-[10px] font-black text-white hover:text-primary transition-all active:scale-95 cursor-pointer leading-tight truncate"
              >
                {fx}
              </button>
            ))}
          </div>
        </div>

        {/* virtual Gifts donation triggering buttons bar */}
        <div className="space-y-2 pt-1 border-t border-white/5">
          <span className="text-[9px] font-mono font-bold tracking-widest text-[#00df82] uppercase block leading-none">virtual Gifts Simulator (Fund streamer):</span>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-0.5">
            {giftsList.map((gift) => (
              <button
                key={gift.name}
                onClick={() => isLive && sendGiftToLive(gift)}
                disabled={!isLive}
                className="flex items-center gap-1.5 flex-shrink-0 bg-[#12141d] border border-white/5 hover:border-yellow-400/40 disabled:opacity-30 py-2 px-3 rounded-xl transition-all active:scale-95 text-xs font-bold text-white cursor-pointer"
              >
                <span className="text-sm">{gift.emoji}</span>
                <div className="text-left">
                  <p className="text-[10px] font-black leading-none">{gift.name}</p>
                  <p className="text-[7.5px] font-mono text-yellow-400 font-bold leading-none mt-1">+{gift.cost} Pts</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Invitation popup module overlay */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 pointer-events-auto"
            />
            
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 max-h-[50%] bg-[#0d0f14] border-t border-white/10 rounded-t-[28px] overflow-hidden z-40 flex flex-col p-5 space-y-4 pointer-events-auto"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-white tracking-widest">Invite artist to co-live jam</h4>
                <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <p className="text-[10px] text-gray-400 leading-normal">
                Select from verified followed artists to launch a reactive split-screen split broadcast.
              </p>

              <div className="space-y-2 overflow-y-auto flex-1 scrollbar-hide">
                {['Ed Maverick', 'Kevin Kaarl', 'Santiago_99'].map((friend) => (
                  <div key={friend} className="bg-black/35 border border-white/5 p-2.5 rounded-xl flex items-center justify-between gap-3 text-white">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={friend === 'Ed Maverick' ? AVATARS[4] : friend === 'Kevin Kaarl' ? AVATARS[3] : AVATARS[1]} 
                        alt="" 
                        className="w-8 h-8 rounded-full object-cover border border-white/5" 
                      />
                      <span className="text-xs font-black">{friend}</span>
                    </div>
                    <button
                      onClick={() => { handleStartCallInvite(friend); setShowInviteModal(false); }}
                      className="bg-primary text-black text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg hover:scale-105 active:scale-95 transition-all"
                    >
                      Dial Invite
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
