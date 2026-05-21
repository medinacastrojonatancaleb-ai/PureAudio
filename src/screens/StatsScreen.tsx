import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Flame, Hourglass, Music, Compass, Radio, Heart, Sparkles, User, Shield } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export default function StatsScreen() {
  const { t, language } = usePlayer();
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('weekly');
  
  // High fidelity simulated real-time stats and metrics 
  const statsData = {
    weekly: {
      energy: [75, 45, 90, 60, 85, 95, 70],
      days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      daysEn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      moods: [
        { label: 'Cyberpunk Focus', percentage: 42, color: '#00df82', glow: 'shadow-[#00df82]/20' },
        { label: 'Ambient Chill', percentage: 28, color: '#00cbff', glow: 'shadow-[#00cbff]/20' },
        { label: 'Hype Phonk', percentage: 18, color: '#ff2 e54', glow: 'shadow-[#ff2e54]/20' },
        { label: 'Late Night Retro', percentage: 12, color: '#b500ff', glow: 'shadow-[#b500ff]/20' },
      ],
      totalHrs: '24.8',
      tracksHeard: 134,
      styleDominant: { es: 'Fluctuación Electrónica', en: 'Hyperpop / Electronic' }
    },
    monthly: {
      energy: [65, 80, 55, 90, 75, 85, 95, 60, 70, 85, 90, 80],
      days: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      daysEn: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      moods: [
        { label: 'Cyberpunk Focus', percentage: 38, color: '#00df82', glow: 'shadow-[#00df82]/20' },
        { label: 'Ambient Chill', percentage: 32, color: '#00cbff', glow: 'shadow-[#00cbff]/20' },
        { label: 'Hype Phonk', percentage: 20, color: '#ff2e54', glow: 'shadow-[#ff2e54]/20' },
        { label: 'Late Night Retro', percentage: 10, color: '#b500ff', glow: 'shadow-[#b500ff]/20' },
      ],
      totalHrs: '102.5',
      tracksHeard: 512,
      styleDominant: { es: 'Frecuencias Ambientales', en: 'Synthwave & Electronic Focus' }
    }
  };

  const currentData = selectedPeriod === 'weekly' ? statsData.weekly : statsData.monthly;

  // Let the user adjust their aura overriding color preference!
  const auras = [
    { id: 'cyber', label: 'Cyberpunk Glow', color: '#00df82', desc: 'Vibrante, activo, verde láser', descEn: 'Vibrant, active, laser green' },
    { id: 'cosmic', label: 'Cosmic Calm', color: '#00cbff', desc: 'Profundo, relajante, azul océano', descEn: 'Deep, relaxing, ocean blue' },
    { id: 'phoenix', label: 'Phoenix Fire', color: '#ff2e54', desc: 'Energético, apasionado, rojo neón', descEn: 'Energetic, passionate, neon red' },
    { id: 'retro', label: 'Late Night Rose', color: '#d946ef', desc: 'Cinematográfico, nostálgico, magenta', descEn: 'Cinematic, nostalgic, magenta' }
  ];

  const handleSetAura = (auraId: string) => {
    // Save aura choice globally on index element
    const root = document.documentElement;
    if (auraId === 'cyber') {
      root.style.setProperty('--color-primary', '#00df82');
      root.style.setProperty('--aura-gradient', 'linear-gradient(to bottom right, #050505, #011E13)');
    } else if (auraId === 'cosmic') {
      root.style.setProperty('--color-primary', '#00cbff');
      root.style.setProperty('--aura-gradient', 'linear-gradient(to bottom right, #050505, #011124)');
    } else if (auraId === 'phoenix') {
      root.style.setProperty('--color-primary', '#ff2e54');
      root.style.setProperty('--aura-gradient', 'linear-gradient(to bottom right, #050505, #240108)');
    } else if (auraId === 'retro') {
      root.style.setProperty('--color-primary', '#d946ef');
      root.style.setProperty('--aura-gradient', 'linear-gradient(to bottom right, #050505, #210124)');
    }
    
    // Dispatch custom event to let App component react instantly
    const event = new CustomEvent('app-aura-changed', { detail: auraId });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-primary animate-pulse w-5 h-5" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] font-mono">
              {language === 'es' ? 'Frecuencia de Sintonía' : 'Cosmic Frequency Report'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
            {language === 'es' ? 'Mi Vibra Cósmica' : 'My Acoustic Vibe'}
          </h1>
          <p className="text-sm text-gray-400 mt-1.5 font-medium">
            {language === 'es' ? 'Tu actividad, sintonías emocionales e impacto de IA.' : 'Analyze your active listening frequencies and AI-crafted moods.'}
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex bg-[#111111]/80 backdrop-blur-md rounded-full p-1 border border-white/5 ring-1 ring-white/5">
          <button
            onClick={() => setSelectedPeriod('weekly')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
              selectedPeriod === 'weekly' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {language === 'es' ? 'Semanal' : 'Weekly'}
          </button>
          <button
            onClick={() => setSelectedPeriod('monthly')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
              selectedPeriod === 'monthly' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {language === 'es' ? 'Mensual' : 'Monthly'}
          </button>
        </div>
      </div>

      {/* Grid: Bento cards for key premium statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric Card 1: Time Heard */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-[#0b0c0f]/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[28px] relative overflow-hidden shadow-2xl flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
              <Hourglass className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-green-400/80 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/10">
              +14% {language === 'es' ? 'esta semana' : 'this week'}
            </span>
          </div>

          <div className="mt-8 space-y-1">
            <h3 className="text-gray-500 text-xs font-black uppercase tracking-wider">
              {language === 'es' ? 'Horas de Resonancia' : 'Aura Resonance Time'}
            </h3>
            <p className="text-4xl lg:text-5xl font-black text-white leading-tight font-mono">
              {currentData.totalHrs}<span className="text-lg text-primary ml-1">hrs</span>
            </p>
          </div>
          
          <p className="text-[11px] text-gray-500 font-medium mt-4">
            {language === 'es' ? 'Tiempo dedicado a vibrar con tus melodías sintonizadas.' : 'Accrued listening duration syncing with your custom frequencies.'}
          </p>
        </motion.div>

        {/* Metric Card 2: Tracks Streamed */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-[#0b0c0f]/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[28px] relative overflow-hidden shadow-2xl flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/10">
              Steady
            </span>
          </div>

          <div className="mt-8 space-y-1">
            <h3 className="text-gray-500 text-xs font-black uppercase tracking-wider">
              {language === 'es' ? 'Pistas Sintonizadas' : 'Frequencies Streamed'}
            </h3>
            <p className="text-4xl lg:text-5xl font-black text-white leading-tight font-mono">
              {currentData.tracksHeard}<span className="text-lg text-purple-400 ml-1">songs</span>
            </p>
          </div>
          
          <p className="text-[11px] text-gray-500 font-medium mt-4">
            {language === 'es' ? 'Sinfonías únicas reproducidas y conectadas al multiverso.' : 'Individual tracks completed in your current dimensional session.'}
          </p>
        </motion.div>

        {/* Metric Card 3: Dominant Genre */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-[#0b0c0f]/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[28px] relative overflow-hidden shadow-2xl flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 border border-cyan-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/10">
              OLED Optim
            </span>
          </div>

          <div className="mt-8 space-y-1">
            <h3 className="text-gray-500 text-xs font-black uppercase tracking-wider">
              {language === 'es' ? 'Espectro Dominante' : 'Dominant Spectrum'}
            </h3>
            <p className="text-2xl lg:text-3xl font-black text-white leading-snug truncate">
              {language === 'es' ? currentData.styleDominant.es : currentData.styleDominant.en}
            </p>
          </div>
          
          <p className="text-[11px] text-gray-500 font-medium mt-4">
            {language === 'es' ? 'Estilo sónico e instrumental que guía tus ritmos diarios.' : 'Acoustical wave-type highly preferred by your brainwaves today.'}
          </p>
        </motion.div>
      </div>

      {/* Mid Section: Weekly Energy Pulsing Graph and Favorite Moods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: Holographic Custom Energy Flow Graph */}
        <div className="lg:col-span-2 bg-[#0b0c0f]/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-white font-black text-lg tracking-tight">
                {language === 'es' ? 'Gráfico de Frecuencia Semanal' : 'Weekly Waveform Amplitude'}
              </h3>
              <p className="text-xs text-gray-400">
                {language === 'es' ? 'Intensidad media de beats por minuto (BPM)' : 'Average emotional BPM intensity rating across sessions'}
              </p>
            </div>
            <TrendingUp className="text-primary w-5 h-5" />
          </div>

          {/* Simple and gorgeous pure HTML + motion SVG neon bar chart that compiles with 0 dependencies */}
          <div className="h-64 flex items-end justify-between pt-10 px-4 relative">
            {/* Grid Line lines behind bars */}
            <div className="absolute inset-x-0 top-1/4 border-t border-white/[0.03] text-[9px] font-mono text-gray-600 flex items-center pr-2 select-none"><span className="mr-auto">Súper Hype</span></div>
            <div className="absolute inset-x-0 top-2/4 border-t border-white/[0.03] text-[9px] font-mono text-gray-600 flex items-center pr-2 select-none"><span className="mr-auto">Activo</span></div>
            <div className="absolute inset-x-0 top-3/4 border-t border-white/[0.03] text-[9px] font-mono text-gray-600 flex items-center pr-2 select-none"><span className="mr-auto">Calma</span></div>
            
            {currentData.energy.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer relative z-10">
                <div className="absolute bottom-[104%] bg-[#111111] text-xs font-mono border border-white/10 rounded-lg px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:-translate-y-1 text-white shadow-xl pointer-events-none z-30">
                  {val}%
                </div>
                {/* Visual Glow Pillar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${val * 0.7}%` }}
                  transition={{ delay: idx * 0.08, type: 'spring', stiffness: 50 }}
                  className="w-4 sm:w-6 lg:w-8 bg-gradient-to-t from-primary/10 via-primary/50 to-primary rounded-t-xl group-hover:brightness-125 transition-all duration-300 relative shadow-[0_0_12px_rgba(0,223,130,0.15)] hover:shadow-[0_0_20px_rgba(0,223,130,0.35)]"
                >
                  {/* Floating particle spec inside the top of the bar */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white animate-ping opacity-60" />
                </motion.div>
                <span className="text-[10px] font-black text-gray-500 mt-3 uppercase tracking-wider font-mono">
                  {language === 'es' ? statsData.weekly.days[idx] : statsData.weekly.daysEn[idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Donut Glow Vibe Distribution */}
        <div className="bg-[#0b0c0f]/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black text-lg tracking-tight">
                {language === 'es' ? 'Top Moods de IA' : 'AI Active Moods'}
              </h3>
              <Flame className="text-red-400 w-5 h-5" />
            </div>

            <div className="space-y-4 pt-2">
              {currentData.moods.map((mood) => (
                <div key={mood.label} className="space-y-1.5 cursor-help group">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span className="group-hover:text-primary transition-colors flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: mood.color, boxShadow: `0 0 8px ${mood.color}` }} />
                      {mood.label}
                    </span>
                    <span className="font-mono">{mood.percentage}%</span>
                  </div>
                  {/* Glowing progress line */}
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/[0.03]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mood.percentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full transition-all"
                      style={{ 
                        backgroundColor: mood.color,
                        boxShadow: `0 0 10px ${mood.color}b0`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-4.5 mt-6 text-center">
            <Radio className="w-5 h-5 mx-auto text-primary animate-pulse mb-1.5" />
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider select-none leading-relaxed">
              {language === 'es' 
                ? 'Gemini analiza constantemente tu ritmo sónico para calibrar tu Aura.' 
                : 'Gemini actively calibrates your acoustic frequency signatures.'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Aura Customizer Playground */}
      <section className="bg-gradient-to-r from-[#031d17]/40 via-surface/80 to-[#021d1e]/40 backdrop-blur-3xl border border-primary/20 p-6 rounded-[32px] shadow-2xl relative overflow-hidden">
        {/* Interactive glow nodes */}
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-44 h-44 bg-[#00cbff]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center relative z-10 w-full">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
              {language === 'es' ? 'Novedad: Aura Estética' : 'New: Holographic Aura'}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
              {language === 'es' ? 'Configura tu Espectro Aura' : 'Calibrate Your Aura Overlay'}
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              {language === 'es' 
                ? 'Altera la resonancia visual y lumínica de toda la interfaz. Elige un modo o sintoniza el color de sintonía para emparejar con tu ánimo.' 
                : 'Morph the visual lighting of VibeSonic. Calibrate the neon pulse to complement your physical and emotional frequency.'}
            </p>
          </div>

          <div className="grid grid-cols-2 xs:flex gap-3 w-full md:w-auto">
            {auras.map((aura) => (
              <motion.button
                key={aura.id}
                onClick={() => handleSetAura(aura.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 xs:flex-none flex flex-col items-center gap-2 p-3 bg-black/40 hover:bg-black/80 rounded-2xl border border-white/5 transition-all text-center relative group min-w-[124px]"
              >
                {/* Active circle glow representation */}
                <div className="w-10 h-10 rounded-full relative flex items-center justify-center filter group-hover:brightness-110 shadow-lg">
                  <div className="absolute inset-0 rounded-full blur-md opacity-60 animate-pulse group-hover:scale-110 transition-transform" style={{ backgroundColor: aura.color }} />
                  <div className="w-5 h-5 rounded-full z-10 shadow-inner" style={{ backgroundColor: aura.color }} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-black text-white group-hover:text-primary transition-colors leading-tight">
                    {aura.label}
                  </p>
                  <p className="text-[9px] text-gray-500 font-bold truncate tracking-tight max-w-[110px]">
                    {language === 'es' ? aura.desc : aura.descEn}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
