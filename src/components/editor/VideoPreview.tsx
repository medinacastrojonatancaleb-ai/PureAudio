import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trash2, RotateCw, Volume2, Scale } from 'lucide-react';
import { DragElement } from './types';

// Preset filters styling utility matching the application theme
export const PRESET_FILTERS = [
  { id: 'none', name: 'Original', cssClass: 'filter-none', glow: '' },
  { id: 'cyberpunk', name: 'Cyber Neon', cssClass: 'hue-rotate-270 saturate-200 contrast-125 sepia-15 brightness-95', glow: 'shadow-[#7C4DFF]/50' },
  { id: 'vaporwave', name: 'Vaporwave', cssClass: 'hue-rotate-185 saturate-150 brightness-110 sepia-10', glow: 'shadow-[#00cbff]/50' },
  { id: 'vhs', name: 'Vintage VHS', cssClass: 'contrast-110 saturate-90 brightness-90 grayscale-[10%] sepia-[15%]', glow: 'shadow-[#00df82]/50' },
  { id: 'golden', name: 'Golden Hour', cssClass: 'sepia contrast-95 saturate-125 brightness-105', glow: 'shadow-yellow-500/50' },
  { id: 'noir', name: 'Mono Noir', cssClass: 'grayscale contrast-150 brightness-90 saturate-0', glow: 'shadow-white/20' }
];

interface VideoPreviewProps {
  mediaUrl: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  elements: DragElement[];
  onUpdateElement: (id: string | number, updates: Partial<DragElement>) => void;
  onRemoveElement: (id: string | number) => void;
  selectedElementId: string | number | null;
  onSelectElement: (id: string | number | null, type: 'video' | 'text' | 'music' | 'sticker' | null) => void;
  activeFilter: string;
  brightness: number;
  contrast: number;
  saturation: number;
  karaokeSubtitle: string | null;
  isVolumeMuted?: boolean;
}

export default function VideoPreview({
  mediaUrl,
  isPlaying,
  currentTime,
  duration,
  videoRef,
  elements,
  onUpdateElement,
  onRemoveElement,
  selectedElementId,
  onSelectElement,
  activeFilter,
  brightness,
  contrast,
  saturation,
  karaokeSubtitle,
  isVolumeMuted = false
}: VideoPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Resolve filter
  const currentFilter = PRESET_FILTERS.find(f => f.id === activeFilter) || PRESET_FILTERS[0];

  // Sync video elements HTML5 state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(err => console.log('Player autoplay wait:', err));
    } else {
      video.pause();
    }
  }, [isPlaying, mediaUrl, videoRef]);

  // Determine if URL is image
  const isImageFile = mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || mediaUrl.startsWith('data:image');

  return (
    <div className="flex flex-col justify-center items-center w-full h-full relative p-4 bg-gradient-to-b from-[#0E1015] to-[#0A0B0E]">
      {/* Absolute Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-[#7C4DFF]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Vertical 9:16 Canvas Phone Frame */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-[275px] sm:max-w-[290px] aspect-[9/16] bg-[#12141C] rounded-[36px] overflow-hidden border-4 border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.9)] flex flex-col justify-between"
      >
        {/* Playback Layer */}
        <div 
          onClick={(e) => {
            // Clicking canvas body clears text/sticker selection and selects video
            if (e.target === e.currentTarget) {
              onSelectElement('video_track', 'video');
            }
          }}
          className={`relative flex-1 w-full h-full overflow-hidden select-none select-none p-4 flex flex-col justify-between ${currentFilter.cssClass}`}
          style={{
            filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
          }}
        >
          {/* Main Visual Source */}
          {isImageFile ? (
            <div className="absolute inset-0 w-full h-full">
              <img 
                src={mediaUrl} 
                alt="Background Source" 
                className="w-full h-full object-cover select-none pointer-events-none" 
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-cyan-500/10 animate-pulse" />
              )}
            </div>
          ) : (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              loop
              muted={isVolumeMuted}
              playsInline
              webkit-playsinline="true"
            />
          )}

          {/* Aesthetic Watermark Layer */}
          <div className="flex justify-between items-center text-[10px] font-mono text-white/40 z-10 pointer-events-none">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#7C4DFF] rounded-full animate-ping" />
              PUREAUDIO PRO
            </span>
            <span>
              00:{currentTime.toFixed(0).padStart(2, '0')} / 00:{duration.toFixed(0).padStart(2, '0')}
            </span>
          </div>

          {/* Drag Overlay Sandbox */}
          <div className="absolute inset-0 z-10">
            {elements.map((el) => {
              const isSelected = selectedElementId === el.id;
              
              const animationStyles = {
                fade: 'transition-opacity opacity-100',
                pop: 'scale-105 transition-transform duration-300',
                zoom: 'scale-110 transition-transform duration-500',
                slide: 'translate-y-[-5px] transition-transform',
                blur: 'blur-0 transition-filter',
                none: ''
              };

              return (
                <motion.div
                  key={el.id}
                  drag
                  dragMomentum={false}
                  dragElastic={0.05}
                  dragConstraints={containerRef}
                  onDrag={(e, info) => {
                    if (!containerRef.current) return;
                    const bounds = containerRef.current.getBoundingClientRect();
                    const nextX = ((info.point.x - bounds.left) / bounds.width) * 100;
                    const nextY = ((info.point.y - bounds.top) / bounds.height) * 100;
                    onUpdateElement(el.id, { 
                      x: Math.min(Math.max(nextX, 0), 100), 
                      y: Math.min(Math.max(nextY, 0), 100) 
                    });
                  }}
                  onPointerDown={() => onSelectElement(el.id, el.type)}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`,
                    fontFamily: el.fontFamily || 'sans-serif'
                  }}
                  className={`absolute z-30 cursor-move inline-block max-w-[200px] select-none text-center transform ${
                    isSelected ? 'ring-2 ring-[#7C4DFF] ring-offset-2 ring-offset-black rounded-lg p-2 bg-black/45 backdrop-blur-[2px] shadow-2xl' : ''
                  }`}
                >
                  {/* Text Layer */}
                  {el.type === 'text' && (
                    <p 
                      style={{ color: el.color || '#FFFFFF', opacity: el.opacity }}
                      className={`text-sm font-black tracking-wide leading-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                        el.animation ? animationStyles[el.animation] : ''
                      }`}
                    >
                      {el.text}
                    </p>
                  )}

                  {/* Sticker Layer */}
                  {el.type === 'sticker' && (
                    <span 
                      style={{ opacity: el.opacity }} 
                      className="text-4xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] select-none pointer-events-none block"
                    >
                      {el.symbol}
                    </span>
                  )}

                  {/* Inline Element Transformer Controls when highlighted */}
                  {isSelected && (
                    <div className="absolute -top-7 -right-7 flex items-center gap-1.5 bg-black/80 backdrop-blur-md rounded-full px-2 py-1 border border-white/10 shadow-lg scale-90 z-40">
                      {/* Rotate indicator */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextRot = (el.rotation + 45) % 360;
                          onUpdateElement(el.id, { rotation: nextRot });
                        }}
                        className="p-1 hover:text-[#7C4DFF] text-gray-400 transition-colors cursor-pointer"
                        title="Rotate"
                      >
                        <RotateCw size={11} />
                      </button>

                      {/* Scale indicator up */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextScale = Math.min(el.scale + 0.15, 2.5);
                          onUpdateElement(el.id, { scale: nextScale });
                        }}
                        className="p-1 hover:text-[#7C4DFF] text-gray-400 transition-colors cursor-pointer"
                        title="Grow"
                      >
                        <Scale size={11} />
                      </button>

                      {/* Scale down */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextScale = Math.max(el.scale - 0.15, 0.5);
                          onUpdateElement(el.id, { scale: nextScale });
                        }}
                        className="p-1 hover:text-[#7C4DFF] text-gray-400 transition-colors cursor-pointer text-[10px] font-black"
                        title="Shrink"
                      >
                        -
                      </button>

                      {/* Delete element button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectElement(null, null);
                          onRemoveElement(el.id);
                        }}
                        className="p-1 hover:text-[#FF3B30] text-gray-400 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Karaoke Synced Subtitle Card */}
          <div className="absolute inset-x-4 bottom-12 z-25 text-center pointer-events-none">
            <AnimatePresence mode="wait">
              {karaokeSubtitle && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="bg-black/85 backdrop-blur-lg border border-[#7C4DFF]/25 px-4 py-2 rounded-full text-[11px] font-black tracking-wide text-[#7C4DFF] uppercase shadow-2xl inline-flex items-center gap-1.5"
                >
                  <Sparkles size={11} className="animate-spin text-white shrink-0" />
                  <span>{karaokeSubtitle}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic Footer Stamp */}
          <div className="flex justify-between items-end z-10 pointer-events-none text-left">
            <div className="flex flex-col">
              <span className="text-[12px] font-black tracking-widest text-white leading-none font-mono">PUREAUDIO</span>
              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">music feed</span>
            </div>
            
            {/* Ambient Audio beat ripple */}
            {isPlaying && (
              <div className="flex items-center gap-[2px] h-3">
                {[5, 12, 8, 14, 6].map((h, idx) => (
                  <motion.div 
                    key={idx}
                    animate={{ height: [4, h, 4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: idx * 0.1 }}
                    className="w-[2.5px] bg-[#7C4DFF] rounded-full"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
