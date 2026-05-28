import React, { useRef } from 'react';
import { Clock, Music, Type, Smile, Eye, VolumeX, EyeOff, Film } from 'lucide-react';
import { DragElement, MusicItem } from './types';

interface TimelineProps {
  currentTime: number;
  duration: number;
  elements: DragElement[];
  onSelectElement: (id: string | number | null, type: 'video' | 'text' | 'music' | 'sticker' | null) => void;
  selectedElementId: string | number | null;
  musicTrack: MusicItem | null;
  activeFilter: string;
  onScrub: (time: number) => void;
  mediaUrl: string;
}

export default function Timeline({
  currentTime,
  duration,
  elements,
  onSelectElement,
  selectedElementId,
  musicTrack,
  activeFilter,
  onScrub,
  mediaUrl
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple timeline coordinate math
  const handleTimelineInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.min(Math.max(clickX / rect.width, 0), 1);
    onScrub(pct * duration);
  };

  const handleTimelineDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return; // Only trigger if mouse button is held down
    handleTimelineInteraction(e);
  };

  // Convert time to percentage for playhead position
  const playheadPercent = (currentTime / duration) * 100;

  return (
    <div id="timeline_parent" className="bg-[#12131A] border-t border-[#252830] p-4 flex flex-col select-none select-none h-[180px] shrink-0">
      
      {/* Time & Playhead Information Header */}
      <div className="flex justify-between items-center text-[10.5px] font-mono text-gray-500 mb-1.5 px-1 pb-1 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Clock size={11} className="text-[#7C4DFF]" />
          <span>TIEMPO:</span>
          <span className="text-white font-black font-sans bg-[#252830] px-2 py-0.5 rounded leading-none">
            00:{currentTime.toFixed(2).padStart(5, '0')}
          </span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400">00:{duration.toFixed(2).padStart(5, '0')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Ajustes: </span>
          <span className="text-sky-400 font-extrabold uppercase text-[9px] font-mono">{activeFilter !== 'none' ? `FX (${activeFilter})` : 'ORIGINAL'}</span>
        </div>
      </div>

      {/* Tracks Container */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Headers Column (Sticky Labels for standard tracks) */}
        <div className="w-[84px] border-r border-[#252830] bg-[#12131A] p-1 flex flex-col gap-2.5 text-left shrink-0 font-sans z-10">
          
          {/* TRACK 1 HEADER - VIDEO */}
          <div 
            onClick={() => onSelectElement('video_track', 'video')}
            className={`p-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 text-[10px] uppercase font-black tracking-tight ${
              selectedElementId === 'video_track' ? 'bg-[#7C4DFF]/15 text-[#7C4DFF]' : 'text-gray-400 hover:bg-[#1E212A]'
            }`}
          >
            <Film size={11} />
            <span>VIDEO</span>
          </div>

          {/* TRACK 2 HEADER - TEXTS */}
          <div className="p-1.5 rounded text-gray-400 flex items-center gap-1.5 text-[10px] uppercase font-black tracking-tight">
            <Type size={11} />
            <span>TEXTOS</span>
          </div>

          {/* TRACK 3 HEADER - STICKERS */}
          <div className="p-1.5 rounded text-gray-400 flex items-center gap-1.5 text-[10px] uppercase font-black tracking-tight">
            <Smile size={11} />
            <span>STICKERS</span>
          </div>

          {/* TRACK 4 HEADER - AUDIO */}
          {musicTrack && (
            <div 
              onClick={() => onSelectElement('music_track', 'music')}
              className={`p-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 text-[10px] uppercase font-black tracking-tight ${
                selectedElementId === 'music_track' ? 'bg-[#00df82]/15 text-[#00df82]' : 'text-gray-400 hover:bg-[#1E212A]'
              }`}
            >
              <Music size={11} />
              <span>AUDIO</span>
            </div>
          )}
        </div>

        {/* Right Tracks Timelines (Scrollable horizontal lanes) */}
        <div 
          ref={containerRef}
          onMouseDown={handleTimelineInteraction}
          onMouseMove={handleTimelineDrag}
          className="flex-1 relative bg-black/35 overflow-x-hidden overflow-y-auto p-1 py-1.5 flex flex-col gap-2 cursor-crosshair"
        >
          {/* VERTICAL RED PLAYHEAD LINE indicator */}
          <div 
            style={{ left: `${playheadPercent}%` }}
            className="absolute top-0 bottom-0 w-[2px] bg-red-500 shadow-[0_0_10px_#ef4444] pointer-events-none z-30 transition-all duration-75"
          >
            {/* Top red diamond handles */}
            <div className="absolute top-0 -left-[5px] w-3 h-3 bg-red-500 rotate-45 border border-white" />
          </div>

          {/* 
            =========================================
            TRACK 1 LANE: Video clip reel strip thumbnails
            =========================================
          */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onSelectElement('video_track', 'video');
            }}
            className={`h-7 rounded flex items-center relative overflow-hidden transition-all border cursor-pointer ${
              selectedElementId === 'video_track' 
                ? 'bg-[#7C4DFF]/10 border-[#7C4DFF] ring-1 ring-[#7C4DFF]/40' 
                : 'bg-black/40 border-white/5 hover:border-white/10'
            }`}
          >
            {/* Horizontal strip thumbnails block simulation */}
            <div className="absolute inset-0 flex items-center gap-1 opacity-50 overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="h-full aspect-[9/16] bg-[#252830] shrink-0 border-r border-[#12131A] overflow-hidden flex items-center justify-center">
                  <span className="text-[7.5px] font-mono text-gray-500">#{i}</span>
                </div>
              ))}
            </div>

            {/* Video metadata stamp */}
            <span className="absolute left-2.5 text-[9px] font-bold text-white uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full" />
              Clip Sónico Principal ({duration.toFixed(0)}s)
            </span>
          </div>

          {/* 
            =========================================
            TRACK 2 LANE: Text Blocks
            =========================================
          */}
          <div className="h-7 relative flex items-center bg-black/10 border border-white/[0.02] rounded overflow-hidden">
            {elements.filter(el => el.type === 'text').map((item) => {
              const elementSelected = selectedElementId === item.id;
              // Renders text starting from item.x across ~30% timeline width
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement(item.id, 'text');
                  }}
                  style={{
                    left: `${Math.max(item.x - 15, 0)}%`,
                    width: '35%'
                  }}
                  className={`absolute h-5.5 rounded px-2 flex items-center gap-1 border text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    elementSelected 
                      ? 'bg-[#7C4DFF] text-black border-white shadow-md font-extrabold' 
                      : 'bg-indigo-950/40 text-indigo-400 border-indigo-900/40 hover:bg-indigo-950/60'
                  }`}
                >
                  <Type size={9} />
                  <span className="truncate max-w-[80px]">{item.text || 'TEXTO'}</span>
                </div>
              );
            })}
          </div>

          {/* 
            =========================================
            TRACK 3 LANE: Stickers Blocks
            =========================================
          */}
          <div className="h-7 relative flex items-center bg-black/10 border border-white/[0.02] rounded overflow-hidden">
            {elements.filter(el => el.type === 'sticker').map((item) => {
              const elementSelected = selectedElementId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement(item.id, 'sticker');
                  }}
                  style={{
                    left: `${Math.max(item.y - 12, 0)}%`, // sticker horizontal aligned to coordinate
                    width: '24%'
                  }}
                  className={`absolute h-5.5 rounded px-1.5 flex items-center gap-1 border text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    elementSelected 
                      ? 'bg-[#00cbff] text-black border-white shadow-md font-extrabold' 
                      : 'bg-cyan-950/40 text-cyan-400 border-cyan-900/40 hover:bg-cyan-950/60'
                  }`}
                >
                  <Smile size={9} />
                  <span>{item.symbol || 'STICKER'}</span>
                </div>
              );
            })}
          </div>

          {/* 
            =========================================
            TRACK 4 LANE: Music Soundwave Blocks
            =========================================
          */}
          {musicTrack && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement('music_track', 'music');
              }}
              className={`h-7 rounded flex items-center justify-between relative overflow-hidden transition-all border cursor-pointer ${
                selectedElementId === 'music_track' 
                  ? 'bg-[#00df82]/15 border-[#00df82] ring-1 ring-[#00df82]/30' 
                  : 'bg-black/30 border-white/[0.03] hover:border-white/5'
              }`}
            >
              {/* Green sound wave pattern blocks */}
              <div className="absolute inset-0 flex items-center gap-[2.5px] px-3 opacity-25 pointer-events-none">
                {[12, 18, 14, 25, 30, 16, 12, 8, 22, 28, 14, 18, 25, 12, 8, 16, 24, 26, 14, 12, 28, 19, 14, 24, 30, 16, 12].map((v, i) => (
                  <div key={i} className="h-full w-[4px] bg-[#00df82] self-center" style={{ height: `${v}%` }} />
                ))}
              </div>

              {/* Music info stamp overlay */}
              <span className="absolute left-2.5 text-[8.5px] font-black text-white hover:text-[#00df82] flex items-center gap-1.5 uppercase transition-colors">
                <Music size={10} className="text-[#00df82]" />
                {musicTrack.title} - {musicTrack.artist} ({musicTrack.volume}%)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
