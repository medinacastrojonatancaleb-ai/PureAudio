import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Disc, Play, Music, Sparkles } from 'lucide-react';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  color?: string;
  height?: number;
}

export function WaveformVisualizer({ isPlaying, color = '#00df82', height = 60 }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    
    // Support high DPI screens
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Sine wave drawing helper
    const drawWave = (
      phase: number,
      amplitude: number,
      frequency: number,
      lineWidth: number,
      opacity: number
    ) => {
      const width = canvas.width / window.devicePixelRatio;
      const heightVal = canvas.height / window.devicePixelRatio;
      const centerY = heightVal / 2;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = opacity;

      for (let x = 0; x < width; x++) {
        // Create an envelope so the wave pinches gracefully at the left/right ends
        const envelope = Math.sin((x / width) * Math.PI);
        const y = centerY + Math.sin(x * frequency + phase) * amplitude * envelope;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    const animate = () => {
      const width = canvas.width / window.devicePixelRatio;
      const heightVal = canvas.height / window.devicePixelRatio;
      
      ctx.clearRect(0, 0, width, heightVal);

      // Mutate phase based on playing speed
      const targetSpeed = isPlaying ? 0.15 : 0.02;
      phaseRef.current += targetSpeed;

      // Draw multiple layers of overlapping waves for natural organic feeling
      if (isPlaying) {
        // Background deep glow waves
        drawWave(phaseRef.current * 0.7, 18, 0.015, 1, 0.15);
        drawWave(phaseRef.current * 0.4 + 1.5, 14, 0.025, 1.5, 0.3);
        drawWave(phaseRef.current * 1.2 + 3.0, 10, 0.035, 1.2, 0.4);
        
        // Active bright foreground wave
        drawWave(phaseRef.current, 22, 0.02, 2.5, 0.85);
      } else {
        // Idle calm breathing wave line
        const breathingAmp = 3 + Math.sin(phaseRef.current) * 1.5;
        drawWave(phaseRef.current, breathingAmp, 0.015, 1.5, 0.4);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isPlaying, color]);

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full pointer-events-none"
      />
    </div>
  );
}

interface RotatingVinylProps {
  isPlaying: boolean;
  thumbnail: string;
}

export function RotatingVinyl({ isPlaying, thumbnail }: RotatingVinylProps) {
  return (
    <div className="relative flex items-center justify-center w-full h-full aspect-square mx-auto select-none">
      {/* Dynamic ambient background glow of the active artwork color */}
      <div 
        className={`absolute inset-0 rounded-full transition-all duration-1000 ${
          isPlaying 
            ? 'bg-primary/20 blur-3xl scale-110 animate-pulse' 
            : 'bg-primary/5 blur-2xl scale-95'
        }`} 
      />

      {/* Interactive Vinyl disk sliding animation wrapper */}
      <motion.div
        animate={isPlaying ? { x: '22%', rotate: 360 } : { x: '0%', rotate: 45 }}
        transition={{
          x: { type: 'spring', stiffness: 50, damping: 12 },
          rotate: isPlaying ? { repeat: Infinity, duration: 15, ease: 'linear' } : { duration: 1.2, ease: 'easeOut' }
        }}
        className="hidden md:flex absolute w-4/5 h-4/5 rounded-full bg-[#030907] border-4 border-outline/30 items-center justify-center p-1 overflow-hidden shadow-2xl z-0 ring-8 ring-black/30"
      >
        {/* Vinyl grooved sound track lines */}
        <div className="absolute inset-0 rounded-full border border-white/[0.04] pointer-events-none z-10" />
        <div className="absolute inset-4 rounded-full border border-white/[0.03] pointer-events-none z-10" />
        <div className="absolute inset-8 rounded-full border border-white/[0.03] pointer-events-none z-10" />
        <div className="absolute inset-12 rounded-full border border-white/[0.03] pointer-events-none z-10" />
        <div className="absolute inset-16 rounded-full border border-white/[0.02] pointer-events-none z-10" />
        <div className="absolute inset-20 rounded-full border border-white/[0.02] pointer-events-none z-10" />
        
        {/* Vinyl Specular Light sweep layer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.06] to-transparent pointer-events-none z-20 mix-blend-overlay rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-white/[0.06] to-transparent pointer-events-none z-20 mix-blend-overlay rounded-full" />

        {/* Center label of the vinyl record */}
        <div className="w-1/3 h-1/3 rounded-full overflow-hidden border border-black/80 shadow-[0_0_8px_rgba(0,0,0,0.8)] relative flex items-center justify-center bg-surface">
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt="" 
              className="w-full h-full object-cover rounded-full filter brightness-90" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <Music size={12} className="text-primary" />
          )}
          {/* Spindle hole */}
          <div className="absolute inset-0 m-auto w-3 h-3 bg-[#010B08] border border-black rounded-full shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.95)] z-30 flex items-center justify-center">
            <div className="w-1 h-1 bg-primary/40 rounded-full" />
          </div>
        </div>
      </motion.div>

      {/* Main Square Jacket/Sleeve Artwork (Always prominent and readable on phone screens) */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative w-full h-full md:w-[82%] md:h-[82%] rounded-[16px] md:rounded-[24px] overflow-hidden bg-surfaceVariant/90 border border-outline/50 shadow-[0_15px_45px_rgba(0,0,0,0.6)] z-10 mx-auto md:mr-auto flex items-center justify-center"
      >
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt="Song Cover" 
            className="w-full h-full object-cover rounded-[22px] transition-transform duration-700" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-primary/40 bg-surface gap-2">
            <Music size={40} className="animate-pulse" />
          </div>
        )}
        
        {/* Subtle decorative elements for a high-end feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90">
          <Disc size={12} className={`text-primary ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          <span className="text-[9px] font-bold tracking-wider font-mono">Hi-Fi</span>
        </div>
      </motion.div>

      {/* Ambient particles when playing representing vivid life */}
      {isPlaying && (
        <>
          <div className="absolute -top-1 -right-1 text-primary animate-bounce duration-[2800ms] opacity-80 pointer-events-none z-20">
            <Sparkles size={16} className="animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div className="absolute -bottom-2 right-12 text-primary animate-pulse opacity-40 pointer-events-none z-20">
            <Sparkles size={10} />
          </div>
        </>
      )}
    </div>
  );
}

interface AudioTrackGridCardProps {
  track: any;
  isActive: boolean;
  onPlay: () => void;
  onLikeToggle: (e: React.MouseEvent) => void;
  isLiked: boolean;
  t: (key: string) => string;
}

export function AudioTrackGridCard({ track, isActive, onPlay, onLikeToggle, isLiked, t }: AudioTrackGridCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onPlay}
      className={`flex flex-col p-4 rounded-2xl bg-surface/40 hover:bg-surfaceVariant/60 border border-outline/35 transition-all duration-300 cursor-pointer group relative overflow-hidden ${
        isActive ? 'bg-surfaceVariant/80 border-primary/40 shadow-[0_8px_30px_rgb(0,223,130,0.06)]' : ''
      }`}
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 shadow-lg bg-black/10">
        <img 
          src={track.thumbnail} 
          alt={track.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-black shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-all duration-300">
            <Play size={22} fill="currentColor" className="ml-0.5" />
          </div>
        </div>
        {isActive && (
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 text-primary text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            <span>{t('now_playing')}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="space-y-0.5">
          <h3 className={`font-black text-sm truncate leading-snug group-hover:text-primary transition-colors ${
            isActive ? 'text-primary' : 'text-white'
          }`}>{track.title}</h3>
          <p className="text-xs text-onSurfaceVariant/80 truncate font-semibold">{track.artist}</p>
        </div>

        <div className="flex items-center justify-between mt-3 gap-2">
          {track.duration && (
            <span className="text-[10px] font-mono text-onSurfaceVariant/60 bg-black/20 px-2 py-0.5 rounded border border-outline/10">
              {track.duration}
            </span>
          )}
          <button 
            onClick={onLikeToggle}
            className={`p-1.5 rounded-full bg-black/25 hover:bg-black/45 border border-outline/10 text-gray-500 hover:text-primary transition-all ${
              isLiked ? 'text-primary border-primary/20 bg-primary/5' : ''
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
