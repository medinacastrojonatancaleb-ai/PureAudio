import React, { useState, useEffect } from 'react';
import { Type, Sparkles, Sliders, Palette, RefreshCcw } from 'lucide-react';
import { DragElement } from './types';

interface TextLayerProps {
  onAddText: (config: { text: string; color: string; animation: 'none' | 'fade' | 'pop' | 'zoom' | 'slide' | 'blur'; fontFamily: string }) => void;
  selectedTextElement: DragElement | null;
  onUpdateElement: (id: string | number, updates: Partial<DragElement>) => void;
}

const PRESET_FONTS = [
  { id: 'inter', name: 'Swiss Sans (Inter)', css: '"Inter", sans-serif' },
  { id: 'grotesk', name: 'Cyber Tech (Grotesk)', css: '"Space Grotesk", sans-serif' },
  { id: 'mono', name: 'Vintage Code (Mono)', css: '"JetBrains Mono", monospace' },
  { id: 'playfair', name: 'Editorial (Serif)', css: '"Playfair Display", serif' },
  { id: 'vandal', name: 'Vandal Punk (Impact)', css: 'Impact, Haettenschweiler, sans-serif' }
];

const NEON_COLORS = [
  { name: 'Glow White', hex: '#FFFFFF' },
  { name: 'Pure Indigo', hex: '#7C4DFF' },
  { name: 'Vapor Neon', hex: '#00cbff' },
  { name: 'Cyber Lime', hex: '#00df82' },
  { name: 'Laser Rose', hex: '#ff2e54' },
  { name: 'Sunset Amber', hex: '#ffaa00' }
];

export default function TextLayer({
  onAddText,
  selectedTextElement,
  onUpdateElement
}: TextLayerProps) {
  const [inputText, setInputText] = useState('');
  const [activeColor, setActiveColor] = useState('#FFFFFF');
  const [activeFont, setActiveFont] = useState('"Space Grotesk", sans-serif');
  const [activeAnim, setActiveAnim] = useState<'none' | 'fade' | 'pop' | 'zoom' | 'slide' | 'blur'>('none');

  // Triggered when selected text element changes to sync current styling controls
  useEffect(() => {
    if (selectedTextElement) {
      setInputText(selectedTextElement.text || '');
      setActiveColor(selectedTextElement.color || '#FFFFFF');
      setActiveFont(selectedTextElement.fontFamily || '"Space Grotesk", sans-serif');
      setActiveAnim(selectedTextElement.animation || 'none');
    }
  }, [selectedTextElement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (selectedTextElement) {
      // Update selected element in-place
      onUpdateElement(selectedTextElement.id, {
        text: inputText,
        color: activeColor,
        fontFamily: activeFont,
        animation: activeAnim
      });
    } else {
      // Create a brand new element
      onAddText({
        text: inputText,
        color: activeColor,
        fontFamily: activeFont,
        animation: activeAnim
      });
      setInputText('');
    }
  };

  return (
    <div id="text_layer_panel" className="space-y-5 text-left font-sans">
      <div className="space-y-1">
        <h3 className="text-xs font-black uppercase text-[#7C4DFF] tracking-wider flex items-center gap-1.5">
          <Type size={13} />
          <span>Tipografía Karaoke Pro</span>
        </h3>
        <p className="text-[10px] text-gray-400 leading-tight">
          Agrega fragmentos o títulos estáticos. Se ajustan con precisión en el lienzo 9:16 y se renderizan fluidamente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Simple input */}
        <div className="space-y-1 bg-black/25 p-3 rounded-2xl border border-white/[0.03]">
          <span className="text-[9.5px] font-mono font-bold text-gray-500 uppercase tracking-widest block mb-1">Escribir Letra:</span>
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              if (selectedTextElement) {
                onUpdateElement(selectedTextElement.id, { text: e.target.value });
              }
            }}
            placeholder="Introduce letra o título..."
            rows={2}
            className="w-full bg-[#12141C] text-xs p-3 rounded-xl border border-white/5 focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF] outline-none text-white placeholder:text-gray-650 resize-none font-bold uppercase tracking-wide"
          />
        </div>

        {/* Font Picker */}
        <div className="space-y-2">
          <span className="text-[9.5px] font-mono font-bold text-gray-500 uppercase tracking-widest block leading-none">Tipo de Fuente:</span>
          <div className="grid grid-cols-2 gap-1.5 bg-black/20 p-1 rounded-xl border border-white/[0.03]">
            {PRESET_FONTS.map((font) => {
              const isActive = activeFont === font.css;
              return (
                <button
                  type="button"
                  key={font.id}
                  onClick={() => {
                    setActiveFont(font.css);
                    if (selectedTextElement) {
                      onUpdateElement(selectedTextElement.id, { fontFamily: font.css });
                    }
                  }}
                  className={`py-2 px-2.5 rounded-lg text-[9.5px] font-black uppercase text-center transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#7C4DFF] text-black font-extrabold shadow-md' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {font.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette Picker */}
        <div className="space-y-2.5">
          <span className="text-[9.5px] font-mono font-bold text-gray-500 uppercase tracking-widest block leading-none">Paleta Neón:</span>
          <div className="grid grid-cols-6 gap-2">
            {NEON_COLORS.map((clr) => {
              const isActive = activeColor === clr.hex;
              return (
                <button
                  type="button"
                  key={clr.hex}
                  onClick={() => {
                    setActiveColor(clr.hex);
                    if (selectedTextElement) {
                      onUpdateElement(selectedTextElement.id, { color: clr.hex });
                    }
                  }}
                  title={clr.name}
                  style={{ backgroundColor: clr.hex }}
                  className={`w-7.5 h-7.5 rounded-full border-2 transition-transform cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center ${
                    isActive ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                  }`}
                >
                  {isActive && <span className="w-1.5 h-1.5 bg-black rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Animation Picker */}
        <div className="space-y-2">
          <span className="text-[9.5px] font-mono font-bold text-gray-500 uppercase tracking-widest block leading-none">Efecto / Animación:</span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'none', label: 'Sin Efecto' },
              { id: 'fade', label: 'Eternidad (Fade)' },
              { id: 'pop', label: 'Impacto (Pop)' },
              { id: 'zoom', label: 'Cinemático (Zoom)' },
              { id: 'slide', label: 'Movimiento (Slide)' },
              { id: 'blur', label: 'Místico (Blur)' }
            ].map((anim) => {
              const isActive = activeAnim === anim.id;
              return (
                <button
                  type="button"
                  key={anim.id}
                  onClick={() => {
                    setActiveAnim(anim.id as any);
                    if (selectedTextElement) {
                      onUpdateElement(selectedTextElement.id, { animation: anim.id as any });
                    }
                  }}
                  className={`py-1.5 px-1 rounded-lg text-[8.5px] uppercase font-bold text-center border cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-[#1C1F2E] text-[#7C4DFF] border-[#7C4DFF]/40 font-black' 
                      : 'bg-black/20 border-white/5 text-gray-450 hover:text-white hover:border-white/10'
                  }`}
                >
                  {anim.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slider Controls for active elements */}
        {selectedTextElement && (
          <div className="space-y-3 bg-[#12141A] p-3 rounded-xl border border-white/5 text-left">
            <span className="text-[9.5px] font-mono font-black text-[#7C4DFF] uppercase tracking-widest block">Propiedades de Capas:</span>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] font-mono text-gray-500">
                <span>OPACIDAD DETALLADA:</span>
                <span className="text-white font-bold">{Math.round(selectedTextElement.opacity * 100)}%</span>
              </div>
              <input 
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={selectedTextElement.opacity}
                onChange={(e) => onUpdateElement(selectedTextElement.id, { opacity: parseFloat(e.target.value) })}
                className="w-full h-1 accent-[#7C4DFF] bg-[#252830] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[9px] font-mono text-gray-500">
                <span>ESCALA / PROPORCIÓN:</span>
                <span className="text-white font-bold">{selectedTextElement.scale.toFixed(2)}x</span>
              </div>
              <input 
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={selectedTextElement.scale}
                onChange={(e) => onUpdateElement(selectedTextElement.id, { scale: parseFloat(e.target.value) })}
                className="w-full h-1 accent-[#7C4DFF] bg-[#252830] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Submit click */}
        <button
          type="submit"
          className="w-full py-3 bg-[#7C4DFF] hover:bg-[#8C5DFF] text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-lg hover:shadow-[#7C4DFF]/15 active:scale-98 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Sparkles size={12} className="text-black" />
          <span>{selectedTextElement ? 'Guardar Cambios' : 'Añadir al Lienzo'}</span>
        </button>
      </form>
    </div>
  );
}
