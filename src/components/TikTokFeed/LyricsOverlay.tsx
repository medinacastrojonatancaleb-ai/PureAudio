import React, { useEffect, useRef, useMemo } from 'react';
import { LyricLine } from './types';

interface LyricsOverlayProps {
  lyrics: LyricLine[];
  currentTime: number;
  seekTo: (time: number) => void;
  activeTrackId: string;
  currentTrackId?: string;
  playTrack: (track: { id: string; title: string; artist: string; thumbnail: string }) => void;
  songMetadata: { id: string; songTitle: string; artist: string; coverUrl: string };
  isActive: boolean;
}

export const LyricsOverlay: React.FC<LyricsOverlayProps> = ({
  lyrics,
  currentTime,
  seekTo,
  activeTrackId,
  currentTrackId,
  playTrack,
  songMetadata,
  isActive,
}) => {
  const lyricsListRef = useRef<HTMLDivElement>(null);

  // Compute the current active lyric index
  const activeLineIndex = useMemo(() => {
    if (lyrics.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyrics, currentTime]);

  // Smooth scroll the current line into the exact middle of the list
  useEffect(() => {
    if (isActive && activeLineIndex !== -1 && lyricsListRef.current) {
      const container = lyricsListRef.current;
      const activeEl = container.querySelector(`[data-lyric-idx="${activeLineIndex}"]`);
      if (activeEl) {
        const containerHeight = container.clientHeight;
        const elOffsetTop = (activeEl as HTMLElement).offsetTop;
        const elHeight = (activeEl as HTMLElement).clientHeight;

        container.scrollTo({
          top: elOffsetTop - containerHeight / 2 + elHeight / 2,
          behavior: 'smooth',
        });
      }
    }
  }, [activeLineIndex, isActive]);

  const handleLineClick = (lineTime: number) => {
    // If this track is not playing, make sure to load/play it first
    if (currentTrackId !== activeTrackId) {
      playTrack({
        id: songMetadata.id,
        title: songMetadata.songTitle,
        artist: songMetadata.artist,
        thumbnail: songMetadata.coverUrl,
      });
    }
    try {
      seekTo(lineTime);
    } catch (err) {
      console.warn('LyricsOverlay: Seek on click failed', err);
    }
  };

  return (
    <div className="lyrics-layer">
      {/* Cinematic Ambient Backdrop Light inside the overlay */}
      <div className="dynamic-light-layer bg-radial from-primary/15 to-transparent blur-3xl" />

      {/* Floating Cinematic Glassmorphic Panel */}
      <div className="lyrics-cinematic-panel pointer-events-auto w-full h-full max-h-[58vh] flex flex-col justify-center">
        
        {/* Scrolling Inner Masked Container */}
        <div
          ref={lyricsListRef}
          className="w-full h-full overflow-y-auto scrollbar-hide py-36 px-4 flex flex-col space-y-10 relative select-none scroll-smooth"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, white 25%, white 75%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 25%, white 75%, transparent 100%)',
          }}
        >
          {lyrics.map((line, lIdx) => {
            const isCurrentLine = isActive && lIdx === activeLineIndex;
            return (
              <div
                key={lIdx}
                data-lyric-idx={lIdx}
                onClick={() => handleLineClick(line.time)}
                className={`lyric-line cursor-pointer ${isCurrentLine ? 'active' : ''}`}
                style={{
                  outline: 'none',
                }}
              >
                {line.text}
              </div>
            );
          })}
          
          {lyrics.length === 0 && (
            <div className="text-center text-white/30 font-black text-xs py-24 tracking-widest uppercase animate-pulse">
              [Summoning Lyrics Sincronizadas]
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

