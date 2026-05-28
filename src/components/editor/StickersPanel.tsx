import React from 'react';
import { Smile, Sparkles, Move } from 'lucide-react';
import { DragElement } from './types';

interface StickersPanelProps {
  onAddSticker: (symbol: string) => void;
  selectedStickerElement: DragElement | null;
  onUpdateElement: (id: string | number, updates: Partial<DragElement>) => void;
}

const POPULAR_EMOJIS = [
  '🔥', '💀', '👽', '👑', '⚡', '🎵', '🎧', '🎸', '🌟', '✨',
  '🎤', '💔', '📈', '👾', '🌀', '🌈', '🚨', '👀', '🔋', '💯'
];

export default function StickersPanel({
  onAddSticker,
  selectedStickerElement,
  onUpdateElement
}: StickersPanelProps) {
  return (
    <div id="stickers_shelf_panel" className="space-y-5 text-left font-sans">
      <div className="space-y-1">
        <h3 className="text-xs font-black uppercase text-[#7C4DFF] tracking-wider flex items-center gap-1.5">
          <Smile size={13} />
          <span>Stickers Sensacionales</span>
        </h3>
        <p className="text-[10px] text-gray-400 leading-tight">
          Agrega elementos expresivos de alto impacto para destacar partes o pulsaciones de tu video.
        </p>
      </div>

      {/* Grid Shelf */}
      <div className="space-y-2">
        <span className="text-[9.5px] font-mono text-gray-500 uppercase tracking-widest block font-bold leading-none">Biblioteca de Elementos:</span>
        <div className="grid grid-cols-5 gap-2 bg-[#12141C] p-3 border border-white/5 rounded-2xl">
          {POPULAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onAddSticker(emoji)}
              className="p-1.5 text-2xl hover:bg-white/5 active:scale-90 transition-all rounded-lg select-none cursor-pointer text-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Selection fine grain control panel */}
      {selectedStickerElement && (
        <div className="space-y-3.5 bg-black/20 p-4 rounded-2xl border border-white/[0.03] text-left">
          <span className="text-[9.5px] font-mono font-black text-[#7C4DFF] uppercase tracking-widest block">Propiedades de Capas:</span>

          {/* Opacity slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-mono text-gray-400">
              <span>OPACIDAD INDIVIDUAL:</span>
              <span className="text-white font-bold">{Math.round(selectedStickerElement.opacity * 100)}%</span>
            </div>
            <input 
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={selectedStickerElement.opacity}
              onChange={(e) => onUpdateElement(selectedStickerElement.id, { opacity: parseFloat(e.target.value) })}
              className="w-full h-1 accent-[#7C4DFF] bg-[#252830] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Scale/Size slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-mono text-gray-400">
              <span>TAMAÑO DEL STICKER:</span>
              <span className="text-white font-bold">{selectedStickerElement.scale.toFixed(2)}x</span>
            </div>
            <input 
              type="range"
              min="0.4"
              max="2.2"
              step="0.1"
              value={selectedStickerElement.scale}
              onChange={(e) => onUpdateElement(selectedStickerElement.id, { scale: parseFloat(e.target.value) })}
              className="w-full h-1 accent-[#7C4DFF] bg-[#252830] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Rotation coordinate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-mono text-gray-400">
              <span>ROTACIÓN SÍNCRONA:</span>
              <span className="text-white font-bold">{selectedStickerElement.rotation}°</span>
            </div>
            <input 
              type="range"
              min="0"
              max="360"
              step="15"
              value={selectedStickerElement.rotation}
              onChange={(e) => onUpdateElement(selectedStickerElement.id, { rotation: parseInt(e.target.value) })}
              className="w-full h-1 accent-[#7C4DFF] bg-[#252830] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Quick guide card */}
      <div className="bg-[#12141A] border border-white/5 rounded-xl p-3 flex gap-2.5 items-center">
        <Move size={13} className="text-cyan-400 animate-bounce" />
        <p className="text-[9.5px] text-gray-500 leading-normal">
          Puedes arrastrar los stickers directamente por la pantalla para acomodar su posición.
        </p>
      </div>
    </div>
  );
}
