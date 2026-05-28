import React from 'react';
import { Volume2, VolumeX, Sliders, Sparkles } from 'lucide-react';

interface AudioControlsProps {
  originalVolume: number;
  soundtrackVolume: number;
  fadeIn: number;
  fadeOut: number;
  onChangeOriginalVolume: (val: number) => void;
  onChangeSoundtrackVolume: (val: number) => void;
  onChangeFadeIn: (val: number) => void;
  onChangeFadeOut: (val: number) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export default function AudioControls({
  originalVolume,
  soundtrackVolume,
  fadeIn,
  fadeOut,
  onChangeOriginalVolume,
  onChangeSoundtrackVolume,
  onChangeFadeIn,
  onChangeFadeOut,
  isMuted = false,
  onToggleMute
}: AudioControlsProps) {
  return (
    <div id="audio_controls_panel" className="space-y-5 text-left font-sans">
      <div className="space-y-1">
        <h3 className="text-xs font-black uppercase text-[#00df82] tracking-wider flex items-center gap-1.5">
          <Volume2 size={13} />
          <span>Mezclador & Controladores</span>
        </h3>
        <p className="text-[10px] text-gray-400 leading-tight">
          Sincroniza el nivel del sonido original de tu video con de la pista de fondo para una mezcla perfecta.
        </p>
      </div>

      {/* Mute button toggler */}
      {onToggleMute && (
        <button
          onClick={onToggleMute}
          className={`w-full py-2.5 rounded-xl border font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            isMuted 
              ? 'bg-red-500/10 border-red-500/30 text-red-500' 
              : 'bg-white/5 border-white/5 text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          <span>{isMuted ? 'MUTE ACTIVADO (SILENCIADO)' : 'SILENCIAR AUDIO TOTAL'}</span>
        </button>
      )}

      {/* Volume Sliders */}
      <div className="space-y-4">
        {/* ORIGINAL VOLUME */}
        <div className="space-y-2 bg-[#12141C] p-3 p-3.5 rounded-2xl border border-white/5">
          <div className="flex justify-between text-[9.5px] font-mono text-gray-400">
            <span>SONIDO ORIGINAL VIDEO:</span>
            <span className="text-[#00df82] font-extrabold font-mono">{originalVolume}%</span>
          </div>
          <div className="flex items-center gap-3">
            <Volume2 size={12} className="text-gray-500" />
            <input 
              type="range"
              min="0"
              max="100"
              value={originalVolume}
              disabled={isMuted}
              onChange={(e) => onChangeOriginalVolume(Number(e.target.value))}
              className="w-full h-1 accent-[#00df82] bg-[#252830] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* SOUNDTRACK VOLUME */}
        <div className="space-y-2 bg-[#12141C] p-3 p-3.5 rounded-2xl border border-white/5">
          <div className="flex justify-between text-[9.5px] font-mono text-gray-400">
            <span>VOLUMEN MÚSICA DE FONDO:</span>
            <span className="text-[#00df82] font-extrabold font-mono">{soundtrackVolume}%</span>
          </div>
          <div className="flex items-center gap-3">
            <Volume2 size={12} className="text-gray-500" />
            <input 
              type="range"
              min="0"
              max="100"
              value={soundtrackVolume}
              disabled={isMuted}
              onChange={(e) => onChangeSoundtrackVolume(Number(e.target.value))}
              className="w-full h-1 accent-[#00df82] bg-[#252830] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-white/[0.04]" />

      {/* Fade Parameters */}
      <div className="space-y-3.5">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold leading-none">Ajuste de Transiciones Sónicas:</span>

        <div className="grid grid-cols-2 gap-3.5">
          {/* FADE IN */}
          <div className="space-y-1.5 bg-[#12141C] p-3 rounded-xl border border-white/5 text-left">
            <span className="text-gray-500 text-[8.5px] font-bold block uppercase">Fade In (Segundos):</span>
            <div className="flex justify-between items-center">
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.5"
                value={fadeIn} 
                onChange={(e) => onChangeFadeIn(parseFloat(e.target.value))}
                className="w-full accent-[#00df82]" 
              />
              <span className="text-white font-black text-[11px] ml-2 font-mono shrink-0">{fadeIn}s</span>
            </div>
          </div>

          {/* FADE OUT */}
          <div className="space-y-1.5 bg-[#12141C] p-3 rounded-xl border border-white/5 text-left">
            <span className="text-gray-500 text-[8.5px] font-bold block uppercase">Fade Out (Segundos):</span>
            <div className="flex justify-between items-center">
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.5"
                value={fadeOut} 
                onChange={(e) => onChangeFadeOut(parseFloat(e.target.value))}
                className="w-full accent-[#00df82]" 
              />
              <span className="text-white font-black text-[11px] ml-2 font-mono shrink-0">{fadeOut}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
