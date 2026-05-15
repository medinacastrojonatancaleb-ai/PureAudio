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
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const { setProgress, seekTarget } = usePlayer();

  // Progress Interval
  useEffect(() => {
    let interval: any;
    if (isReady && isPlaying && playerRef.current) {
      interval = setInterval(() => {
        try {
          const current = playerRef.current.getCurrentTime();
          const total = playerRef.current.getDuration();
          if (typeof current === 'number' && typeof total === 'number') {
            setProgress(current, total);
          }
        } catch (e) {}
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isReady, isPlaying, setProgress]);

  // Handle seeking
  useEffect(() => {
    if (isReady && playerRef.current && seekTarget !== null) {
      try {
        playerRef.current.seekTo(seekTarget, true);
      } catch (e) {}
    }
  }, [seekTarget, isReady]);

  // Update active video ID when prop changes
  useEffect(() => {
    if (videoId && isReady && playerRef.current) {
      const currentVideoId = playerRef.current.getVideoData?.()?.video_id;
      if (currentVideoId && currentVideoId !== videoId) {
        console.log('LOADING NEW VIDEO ID:', videoId);
        try {
          // Use loadVideoById to update the existing iframe instead of remounting
          playerRef.current.loadVideoById(videoId);
          setActiveVideoId(videoId);
          if (!isPlaying) {
             // If we loaded it but we shouldn't be playing yet
             // Note: loadVideoById starts playing immediately.
             // We might need cueVideoById if isPlaying is false.
          }
        } catch (e) {
          console.warn('Manual load error:', e);
        }
      }
    } else if (videoId) {
      setActiveVideoId(videoId);
    }
  }, [videoId, isReady, isPlaying]);

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
    
    // Ignore events if the videoId has changed but this event is from the previous one
    // Note: react-youtube doesn't easily expose the current video ID in the event target
    // but we can try to be defensive.
    
    if (event.data === PLAYER_STATES.PLAYING) {
      console.log('VIDEO PLAYING:', videoId);
      try {
        event.target.unMute();
        event.target.setVolume(volume * 100);
      } catch (e) {}
    }
    
    if (event.data === PLAYER_STATES.ENDED) {
      console.log('VIDEO ENDED:', videoId);
      onTrackEnd?.();
    }
  }, [onTrackEnd, volume, videoId]);

  const onPlayerError: YouTubeProps['onError'] = useCallback((event: any) => {
    console.error('YouTube Player Error:', event.data);
    // Explicitly check for blocked videos in player component too
    if ([101, 150].includes(event.data)) {
      console.warn('Track restricted, skipping from player...');
      onTrackEnd?.(); // Trigger skip
    } else {
      onError?.(event.data);
    }
  }, [onError, onTrackEnd]);

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

