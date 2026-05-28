import React from 'react';
import { Sparkles, SlidersHorizontal, Sun, Contrast, Eye } from 'lucide-react';
import { PRESET_FILTERS } from './VideoPreview';

interface FiltersPanelProps {
  activeFilter: string;
  onChangeFilter: (id: string) => void;
  brightness: number;
  contrast: number;
  saturation: number;
  onChangeAdjustments: (type: 'brightness' | 'contrast' | 'saturation', value: number) => void;
}

export default function FiltersPanel({
  activeFilter,
  onChangeFilter,
  brightness,
  contrast,
  saturation,
  onChangeAdjustments
}: FiltersPanelProps) {
  return (
    <div id="filters_fx_panel" className="space-y-6 text-left font-sans">
      <div className="space-y-1">
        <h3 className="text-xs font-black uppercase text-[#7C4DFF] tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-[#7C4DFF]" />
          <span>Filtros Atmosféricos</span>
        </h3>
        <p className="text-[10px] text-gray-400 leading-tight">
          Agrega colores intensos y filtros vintage que transforman gradualmente la vibra cromática de tu proyecto.
        </p>
      </div>

      {/* Grid of presets */}
      <div className="grid grid-cols-3 gap-2.5">
        {PRESET_FILTERS.map((filt) => {
          const isActive = activeFilter === filt.id;
          return (
            <button
              key={filt.id}
              onClick={() => onChangeFilter(filt.id)}
              className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer group hover:bg-[#12141a]/60 ${
                isActive 
                  ? 'bg-[#7C4DFF]/10 border-[#7C4DFF] text-white shadow-xl shadow-[#7C4DFF]/5' 
                  : 'bg-black/20 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {/* Colored Thumbnail representer */}
              <div className={`w-9 h-9 rounded-full bg-gradient-to-tr from-[#1b1c25] to-black border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden ${filt.cssClass}`}>
                <span className="text-[10px] text-[#7C4DFF]">★</span>
              </div>
              <span className="text-[9px] font-black uppercase truncate max-w-full text-gray-300 group-hover:text-white">
                {filt.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="h-px bg-white/[0.04]" />

      {/* Adjustment Sliders */}
      <div className="space-y-4">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold leading-none">Ajustes Finos de Imagen:</span>

        {/* BRIGHTNESS */}
        <div className="space-y-2 bg-[#12141A] p-3 rounded-xl border border-white/5">
          <div className="flex justify-between text-[9.5px] font-mono text-gray-400">
            <span className="flex items-center gap-1"><Sun size={10} /> BRILLO INDIVIDUAL:</span>
            <span className="text-white font-extrabold font-mono">{brightness}%</span>
          </div>
          <input 
            type="range"
            min="50"
            max="150"
            value={brightness}
            onChange={(e) => onChangeAdjustments('brightness', Number(e.target.value))}
            className="w-full h-1 accent-[#7C4DFF] bg-[#252830] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* CONTRAST */}
        <div className="space-y-2 bg-[#12141A] p-3 rounded-xl border border-white/5">
          <div className="flex justify-between text-[9.5px] font-mono text-gray-400">
            <span className="flex items-center gap-1"><Contrast size={10} /> CONTRASTE LINEAL:</span>
            <span className="text-white font-extrabold font-mono">{contrast}%</span>
          </div>
          <input 
            type="range"
            min="50"
            max="150"
            value={contrast}
            onChange={(e) => onChangeAdjustments('contrast', Number(e.target.value))}
            className="w-full h-1 accent-[#7C4DFF] bg-[#252830] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* SATURATION */}
        <div className="space-y-2 bg-[#12141A] p-3 rounded-xl border border-white/5">
          <div className="flex justify-between text-[9.5px] font-mono text-gray-400">
            <span className="flex items-center gap-1"><Eye size={10} /> SATURACIÓN GAMA:</span>
            <span className="text-white font-extrabold font-mono">{saturation}%</span>
          </div>
          <input 
            type="range"
            min="20"
            max="180"
            value={saturation}
            onChange={(e) => onChangeAdjustments('saturation', Number(e.target.value))}
            className="w-full h-1 accent-[#7C4DFF] bg-[#252830] rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
