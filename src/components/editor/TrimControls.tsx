import React from 'react';
import { Scissors, Sliders, Play, RotateCcw } from 'lucide-react';

interface TrimControlsProps {
  trimStart: number;
  trimEnd: number;
  duration: number;
  onUpdateTrim: (start: number, end: number) => void;
  speed: number;
  onChangeSpeed: (val: number) => void;
}

export default function TrimControls({
  trimStart,
  trimEnd,
  duration,
  onUpdateTrim,
  speed,
  onChangeSpeed
}: TrimControlsProps) {

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (val < trimEnd - 1.5) {
      onUpdateTrim(val, trimEnd);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (val > trimStart + 1.5) {
      onUpdateTrim(trimStart, val);
    }
  };

  return (
    <div id="trim_controls_panel" className="space-y-5 text-left font-sans">
      <div className="space-y-1">
        <h3 className="text-xs font-black uppercase text-[#7C4DFF] tracking-wider flex items-center gap-1.5">
          <Scissors size={13} />
          <span>Recortar Segmento Clip</span>
        </h3>
        <p className="text-[10px] text-gray-400 leading-tight">
          Sincroniza el punto exacto para formar tu bucle perfecto de 15 segundos para el feed.
        </p>
      </div>

      {/* Numerical Indicators */}
      <div className="grid grid-cols-2 gap-3.5 text-[10.5px] font-mono">
        <div className="bg-[#12141C] p-3 rounded-xl border border-white/5 text-left">
          <span className="text-gray-500 font-bold block mb-1">MARGEN INICIO (Segundos):</span>
          <span className="text-white font-extrabold font-sans text-xs">
            00:{trimStart.toFixed(1).padStart(4, '0')}s
          </span>
        </div>
        <div className="bg-[#12141C] p-3 rounded-xl border border-white/5 text-left">
          <span className="text-gray-500 font-bold block mb-1">MARGEN FINAL (Segundos):</span>
          <span className="text-white font-extrabold font-sans text-xs">
            00:{trimEnd.toFixed(1).padStart(4, '0')}s
          </span>
        </div>
      </div>

      {/* Sliding Control Tracks */}
      <div className="space-y-4 bg-black/20 p-4 rounded-2xl border border-white/[0.03]">
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] font-mono text-gray-500">
            <span>AJUSTAR CORTE INICIAL:</span>
            <span className="text-[#7C4DFF] font-bold">{trimStart.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration - 2}
            step={0.1}
            value={trimStart}
            onChange={handleStartChange}
            className="w-full h-1.5 accent-[#7C4DFF] bg-[#252830] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[9px] font-mono text-gray-500">
            <span>AJUSTAR CORTE FINAL:</span>
            <span className="text-[#7C4DFF] font-bold">{trimEnd.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min={2}
            max={duration}
            step={0.1}
            value={trimEnd}
            onChange={handleEndChange}
            className="w-full h-1.5 accent-[#7C4DFF] bg-[#252830] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex justify-between text-[8px] font-mono text-gray-600 font-bold uppercase pt-1">
          <span>0.0s (Sutil / Intro)</span>
          <span>{duration.toFixed(1)}s (Total)</span>
        </div>
      </div>

      {/* Speed Multiplier controls */}
      <div className="space-y-2.5">
        <span className="text-[9.5px] font-mono text-gray-500 uppercase tracking-widest block font-bold leading-none">Acelerador / Velocidad:</span>
        <div className="grid grid-cols-4 gap-2 bg-[#12141C] p-1 rounded-xl border border-white/5">
          {([0.5, 1.0, 1.5, 2.0] as const).map((spd) => {
            const isActive = speed === spd;
            return (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#7C4DFF] text-black font-extrabold shadow' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            );
          })}
        </div>
      </div>

      {/* Clean informative card */}
      <div className="bg-[#12141A] border border-white/5 rounded-2xl p-4 flex gap-3 text-left">
        <RotateCcw className="w-4.5 h-4.5 text-cyan-400 shrink-0 mt-0.5 animate-spin" />
        <div className="space-y-1">
          <p className="text-[10.5px] font-black text-white leading-tight uppercase">Historial de Bucle Sincronizado</p>
          <p className="text-[9.5px] text-gray-500 leading-normal">
            Al recortar, la reproducción se acopla inmediatamente para que puedas escuchar el final e inicio fluidamente antes de publicar.
          </p>
        </div>
      </div>
    </div>
  );
}
