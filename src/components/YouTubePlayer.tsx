import React, { useEffect, useRef, useState, useCallback } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { usePlayer } from '../context/PlayerContext';

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
  const activeVideoId = useRef<string | null>(null);
  const { setProgress, seekTarget } = usePlayer();

  // Keep track of the current videoId we SHOULD be playing
  useEffect(() => {
    activeVideoId.current = videoId || null;
  }, [videoId]);

  // Progress Interval
  useEffect(() => {
    let interval: any;
    if (isReady && isPlaying && playerRef.current) {
      interval = setInterval(() => {
        try {
          // Check if the current player video ID matches what we expect
          // to avoid updating progress for a transitioning video
          const currentVideoData = playerRef.current.getVideoData?.();
          if (currentVideoData && currentVideoData.video_id !== activeVideoId.current) {
            return;
          }
 
          const current = playerRef.current.getCurrentTime();
          const total = playerRef.current.getDuration();
          if (typeof current === 'number' && typeof total === 'number') {
            setProgress(current, total);
          }
        } catch (e) {
          // Ignore transient errors
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isReady, isPlaying, setProgress]);

  // Handle seeking
  useEffect(() => {
    if (isReady && playerRef.current && seekTarget !== null) {
      try {
        const currentVideoData = playerRef.current.getVideoData?.();
        if (currentVideoData && currentVideoData.video_id === activeVideoId.current) {
          playerRef.current.seekTo(seekTarget, true);
        }
      } catch (e) {
        // Ignore seek errors
      }
    }
  }, [seekTarget, isReady]);

  // Stop video on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.stopVideo?.();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  // Sync volume
  useEffect(() => {
    if (isReady && playerRef.current) {
      try {
        playerRef.current.setVolume(volume * 100);
      } catch (e) {
        // Ignore volume sync errors
      }
    }
  }, [volume, isReady]);

  // Sync play/pause
  useEffect(() => {
    if (!isReady || !playerRef.current || !videoId) return;

    try {
      const currentVideoData = playerRef.current.getVideoData?.();
      // Only control if the player is currently on the correct video
      if (currentVideoData && currentVideoData.video_id === activeVideoId.current) {
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      }
    } catch (e) {
      // Ignore control errors
    }
  }, [isPlaying, isReady, videoId]);

  const onPlayerReady: YouTubeProps['onReady'] = useCallback((event: any) => {
    console.log('PLAYER READY', videoId);
    if (!event.target) return;
    
    playerRef.current = event.target;
    setIsReady(true);
    
    try {
      event.target.setVolume(volume * 100);
      // We start muted to bypass autoplay restrictions better, then unmute on first play
      event.target.mute(); 
      if (isPlaying) {
        event.target.playVideo();
      }
    } catch (e) {
      // Ignore setup errors 
    }
  }, [volume, isPlaying, videoId]);

  const onPlayerStateChange: YouTubeProps['onStateChange'] = useCallback((event: any) => {
    if (!event.target) return;
    
    const currentVideoData = event.target.getVideoData?.();
    const eventVideoId = currentVideoData?.video_id;

    // Only process events for the current intended video
    if (eventVideoId && eventVideoId !== activeVideoId.current) {
       return;
    }
    
    if (event.data === PLAYER_STATES.PLAYING) {
      try {
        event.target.unMute();
        event.target.setVolume(volume * 100);
      } catch (e) {
        // Ignore state change errors
      }
    }
    
    if (event.data === PLAYER_STATES.ENDED) {
      console.log('VIDEO ENDED:', eventVideoId);
      // Avoid rapid-fire end events (must have played at least 5 seconds or it's been a while since last end)
      const currentTime = event.target.getCurrentTime();
      if (currentTime > 5 || currentTime === 0) {
        onTrackEnd?.();
      }
    }
  }, [onTrackEnd, volume]);

  const onPlayerError: YouTubeProps['onError'] = useCallback((event: any) => {
    const currentVideoData = event.target?.getVideoData?.();
    if (currentVideoData && currentVideoData.video_id !== activeVideoId.current) {
       return;
    }
    console.error('YouTube Player Error:', event.data, activeVideoId.current);
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

