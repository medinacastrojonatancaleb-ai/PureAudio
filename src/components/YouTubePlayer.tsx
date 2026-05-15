import React, { useEffect, useRef, useState, useCallback } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';

interface YouTubePlayerProps {
  videoId: string | null | undefined;
  isPlaying: boolean;
  volume: number;
  onTrackEnd?: () => void;
  onError?: (errorCode: number) => void;
}

const PLAYER_STATES = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

export default function YouTubePlayer({ 
  videoId, 
  isPlaying, 
  volume, 
  onTrackEnd, 
  onError 
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  // Stop video on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.stopVideo?.();
        } catch (e) {
          console.warn('Cleanup error:', e);
        }
      }
    };
  }, []);

  // Sync volume
  useEffect(() => {
    if (isReady && playerRef.current) {
      try {
        const iframe = typeof playerRef.current.getIframe === 'function' ? playerRef.current.getIframe() : null;
        if (iframe && iframe.parentNode) {
          playerRef.current.setVolume(volume * 100);
        }
      } catch (e) {
        console.warn('Volume sync error:', e);
      }
    }
  }, [volume, isReady]);

  // Sync play/pause
  useEffect(() => {
    if (!isReady || !playerRef.current || !videoId) return;

    try {
      const iframe = typeof playerRef.current.getIframe === 'function' ? playerRef.current.getIframe() : null;
      if (iframe && iframe.parentNode) {
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      }
    } catch (e) {
      console.warn('Playback control error:', e);
    }
  }, [isPlaying, isReady, videoId]);

  const onPlayerReady: YouTubeProps['onReady'] = useCallback((event: any) => {
    console.log('PLAYER READY');
    if (!event.target) return;
    
    playerRef.current = event.target;
    setIsReady(true);
    
    try {
      event.target.setVolume(volume * 100);
      event.target.mute();
      if (isPlaying && videoId) {
        event.target.playVideo();
      }
    } catch (e) {
      console.warn('Initial player setup error:', e);
    }
  }, [volume, isPlaying, videoId]);

  const onPlayerStateChange: YouTubeProps['onStateChange'] = useCallback((event: any) => {
    if (!event.target) return;

    if (event.data === PLAYER_STATES.PLAYING) {
      console.log('VIDEO PLAYING');
      try {
        event.target.unMute();
        event.target.setVolume(volume * 100);
      } catch (e) {}
    }
    
    if (event.data === PLAYER_STATES.ENDED) {
      console.log('VIDEO ENDED');
      onTrackEnd?.();
    }
  }, [onTrackEnd, volume]);

  const onPlayerError: YouTubeProps['onError'] = useCallback((event: any) => {
    console.error('YouTube Player Error:', event.data);
    onError?.(event.data);
  }, [onError]);

  const opts = React.useMemo<YouTubeProps['opts']>(() => ({
    height: '64',
    width: '64',
    host: 'https://www.youtube.com',
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
      enablejsapi: 1,
      origin: window.location.origin,
      mute: 1,
    },
  }), []);

  // CRITICAL FIX: Do not render if videoId is missing.
  // This prevents react-youtube from trying to build an iframe with an invalid src.
  if (!videoId) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-16 h-16 opacity-100 overflow-hidden z-[100] border border-white/10 rounded-xl bg-black">
      <YouTube 
        videoId={videoId} 
        opts={opts} 
        onReady={onPlayerReady} 
        onStateChange={onPlayerStateChange}
        onError={onPlayerError}
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      </div>
    </div>
  );
}

