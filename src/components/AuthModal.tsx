import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, AlertCircle, Play, ArrowRight, User, Mail, ShieldAlert } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATARS = [
  {
    name: 'Vinyl Lover',
    url: 'https://images.unsplash.com/photo-1539625313006-231253d2ae00?auto=format&fit=crop&q=80&w=200',
    color: 'from-yellow-400 to-amber-600'
  },
  {
    name: 'Retro Beat',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200',
    color: 'from-emerald-400 to-teal-600'
  },
  {
    name: 'Vintage Synth',
    url: 'https://images.unsplash.com/photo-1608155686393-8fdd966d784d?auto=format&fit=crop&q=80&w=200',
    color: 'from-purple-500 to-indigo-600'
  },
  {
    name: 'Chilled Wave',
    url: 'https://images.unsplash.com/photo-1515462277126-270d878326e5?auto=format&fit=crop&q=80&w=200',
    color: 'from-pink-500 to-rose-600'
  },
  {
    name: 'Classic Keys',
    url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=200',
    color: 'from-cyan-400 to-blue-600'
  },
  {
    name: 'Acoustic Soul',
    url: 'https://images.unsplash.com/photo-1525201548942-d8c8b0915a2c?auto=format&fit=crop&q=80&w=200',
    color: 'from-orange-400 to-red-600'
  }
];

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, loginCustom, t, language } = usePlayer();
  const [activeTab, setActiveTab] = useState<'express' | 'google'>('express');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].url);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (!isOpen) return null;

  const handleExpressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoggingIn(true);
    setTimeout(() => {
      loginCustom(username.trim(), selectedAvatar, email.trim() || undefined);
      setIsLoggingIn(false);
      onClose();
    }, 800);
  };

  const handleGoogleSubmit = async () => {
    setIsLoggingIn(true);
    try {
      await login();
      onClose();
    } catch (_) {
      // Handled by context fallback
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleInstantExpress = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
      const names = [
        'Melómano Pro', 'Synth Lofi', 'Jazz Soul', 
        'Vibe Catcher', 'Acoustic Fan', 'Cyber Rocker'
      ];
      const randomName = `${names[Math.floor(Math.random() * names.length)]}_${Math.floor(Math.random() * 900 + 100)}`;
      const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)].url;
      loginCustom(randomName, randomAvatar);
      setIsLoggingIn(false);
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 30, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 flex flex-col"
        >
          {/* Header background glow */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

          {/* Top actions/Close */}
          <div className="flex items-center justify-between p-6 pb-2 z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <Sparkles size={16} />
              </div>
              <span className="font-black text-xs uppercase tracking-[0.2em] text-primary">{t('premium_member')}</span>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 pt-2 space-y-6 z-10">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight">{t('welcome_title')}</h2>
              <p className="text-xs text-gray-400">{t('join_session')}</p>
            </div>

            {/* Premium Selector Tabs */}
            <div className="grid grid-cols-2 bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('express')}
                className={`py-2 text-xs font-black rounded-lg transition-all ${
                  activeTab === 'express' 
                    ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {language === 'es' ? 'Acceso Express Custom' : 'Custom Express Login'}
              </button>
              <button
                onClick={() => setActiveTab('google')}
                className={`py-2 text-xs font-black rounded-lg transition-all ${
                  activeTab === 'google' 
                    ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {language === 'es' ? 'Google / Sync' : 'Google Sync'}
              </button>
            </div>

            {/* Tab content: Express */}
            {activeTab === 'express' && (
              <form onSubmit={handleExpressSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    {t('enter_name')}
                  </label>
                  <div className="relative flex items-center">
                    <User size={16} className="absolute left-3 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={language === 'es' ? 'Ej. Melómano_42' : 'e.g. MusicLover42'}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-gray-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    {t('enter_email')}
                  </label>
                  <div className="relative flex items-center">
                    <Mail size={16} className="absolute left-3 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="musica@pureaudio.local"
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-gray-600"
                    />
                  </div>
                </div>

                {/* Avatar Picker */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                    {t('avatar_label')}
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATARS.map((avatar) => (
                      <button
                        key={avatar.name}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar.url)}
                        className={`relative aspect-square rounded-full overflow-hidden transition-all duration-300 transform ${
                          selectedAvatar === avatar.url 
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-[#121212] scale-110' 
                            : 'opacity-60 hover:opacity-100 hover:scale-105'
                        }`}
                        title={avatar.name}
                      >
                        <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                        <div className={`absolute inset-0 bg-gradient-to-tr ${avatar.color} opacity-20`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isLoggingIn || !username.trim()}
                    className="w-full bg-white hover:bg-primary hover:text-black hover:scale-[1.02] active:scale-[0.98] text-black py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isLoggingIn ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {t('start_listening')}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleInstantExpress}
                    className="w-full bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5"
                  >
                    {t('guest_login_btn')}
                  </button>
                </div>
              </form>
            )}

            {/* Tab content: Google */}
            {activeTab === 'google' && (
              <div className="space-y-6">
                <p className="text-xs text-gray-400 leading-relaxed">
                  {language === 'es' 
                    ? 'Sincroniza tus listas de reproducción favoritas, artistas seguidos e historial de escucha en tiempo real utilizando Google Firebase Cloud.'
                    : 'Sync your favorite playlist tracks, followed artists, and listen history in real time using Google Firebase Cloud.'}
                </p>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 text-yellow-500">
                  <ShieldAlert size={20} className="flex-shrink-0 mt-0.5" />
                  <p className="text-[10.5px] leading-relaxed">
                    {t('auth_help')}
                  </p>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleSubmit}
                    disabled={isLoggingIn}
                    className="w-full bg-primary hover:scale-[1.02] active:scale-[0.98] text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                  >
                    {isLoggingIn ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {t('google_login_btn')}
                        <Play size={10} fill="currentColor" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleInstantExpress}
                    className="w-full bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5"
                  >
                    {t('guest_login_btn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
