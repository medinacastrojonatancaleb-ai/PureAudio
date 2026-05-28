import React, { useEffect, useRef } from 'react';
import YouTube from 'react-youtube';

interface VideoManagerProps {
  videoId: string;
  isActive: boolean;
  isPlaying: boolean;
  currentTime: number;
}

export const VideoManager: React.FC<VideoManagerProps> = ({
  videoId,
  isActive,
  isPlaying,
  currentTime,
}) => {
  const playerRef = useRef<any>(null);

  // Synchronize playing states
  useEffect(() => {
    if (playerRef.current && isActive) {
      try {
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      } catch (err) {
        console.warn('VideoManager: Playback sync failed', err);
      }
    }
  }, [isPlaying, isActive]);

  // Synchronize seek/time
  useEffect(() => {
    if (playerRef.current && isActive && isPlaying) {
      try {
        const bgTime = playerRef.current.getCurrentTime();
        if (typeof bgTime === 'number' && Math.abs(bgTime - currentTime) > 2) {
          playerRef.current.seekTo(currentTime, true);
        }
      } catch (err) {
        console.warn('VideoManager: Seek sync failed', err);
      }
    }
  }, [currentTime, isActive, isPlaying]);

  if (!isActive) return null;

  return (
    <div 
      className="absolute overflow-hidden pointer-events-none z-[-50] opacity-0"
      style={{
        position: 'absolute',
        top: '-10px',
        left: '-10px',
        width: '1px',
        height: '1px',
        opacity: 0.001,
        pointerEvents: 'none',
      }}
    >
      <YouTube
        videoId={videoId}
        opts={{
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            autohide: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
            mute: 1,
            loop: 1,
            playlist: videoId,
          },
        }}
        containerClassName="absolute w-full h-full pointer-events-none select-none overflow-hidden"
        className="w-full h-full pointer-events-none"
        onReady={(event) => {
          playerRef.current = event.target;
          try {
            event.target.mute();
            if (isPlaying) {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }
            event.target.seekTo(currentTime, true);
          } catch (err) {
            console.warn('VideoManager onReady error:', err);
          }
        }}
      />
    </div>
  );
};
