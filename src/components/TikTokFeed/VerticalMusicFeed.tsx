import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { SnapScrollContainer } from './SnapScrollContainer';
import { FloatingHeader } from './FloatingHeader';
import { MusicCard } from './MusicCard';
import { FeedItem } from './types';
import { youtubeService } from '../../services/youtubeService';
import { generateFeedCatalog } from './songsCatalog';

// Sincronización base para pistas de música populares
const SYNCED_LYRICS_MOCK: Record<string, { time: number; text: string }[]> = {
  "9_C73VnkyrQ": [
    { time: 0, text: "La, la, la-la, la-la" },
    { time: 3, text: "La, la, la, la-la-la, la-la" },
    { time: 7, text: "Quisiera volver atrás" },
    { time: 11, text: "Y otra vez bailar" },
    { time: 14, text: "Abrazado a ti" },
    { time: 19, text: "Abrazado a ti" },
    { time: 24, text: "Huir de esta ciudad" },
    { time: 29, text: "Y llorar de amor" },
    { time: 34, text: "Abrazado a ti" },
    { time: 39, text: "Abrazado a ti" },
    { time: 44, text: "Besarte y que esta vez" },
    { time: 49, text: "No me digas que" },
    { time: 54, text: "Ya me puedo ir" },
    { time: 58, text: "La, la, la" },
    { time: 63, text: "Abrazado a ti" },
    { time: 68, text: "Abrazado a ti" }
  ],
  "yKNxeF4KAtY": [
    { time: 0, text: "Look at the stars" },
    { time: 4, text: "Look how they shine for you" },
    { time: 9, text: "And everything you do" },
    { time: 14, text: "Yeah, they were all yellow" },
    { time: 19, text: "I came along" },
    { time: 23, text: "I wrote a song for you" },
    { time: 28, text: "And all the things you do" },
    { time: 33, text: "And it was called Yellow" }
  ],
  "y3mXyF9_B8a": [
    { time: 0, text: "Baby, no me llames" },
    { time: 3, text: "Que yo estoy ocupá' olvidando tus males" },
    { time: 7, text: "Ya decidí que esta noche se sale" },
    { time: 11, text: "Con todas mis motomamis, con todas mis gyales" },
    { time: 15, text: "Y ando despechá', oah, alocá'" },
    { time: 20, text: "Bajé con un flow nuevo de paquete, de paquete" }
  ],
  "gJnQX-87-hs": [
    { time: 0, text: "Tú y yo, bajo el sol de San Lucas" },
    { time: 5, text: "Con el viento que sopla en tu cara" },
    { time: 9, text: "Dile ya a tus papás que no vas a regresar" },
    { time: 15, text: "Que te vas a quedar a vivir en el mar" },
    { time: 21, text: "Mírame bien, que no queda tiempo" },
    { time: 27, text: "Mírame bien, que ya me estoy yendo" }
  ]
};

// Generate our full 500 real popular songs list on mount
const FEED_SEEDS = generateFeedCatalog();

export const VerticalMusicFeed: React.FC = () => {
  const {
    playTrack,
    currentTrack,
    isPlaying,
    stopTrack,
    currentTime,
    duration,
    togglePlay,
    seekTo,
  } = usePlayer();

  const [activeIndex, setActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicTracks, setDynamicTracks] = useState<FeedItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounced live YouTube lookups to complement the 500 songs list
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDynamicTracks([]);
      return;
    }

    setSearchLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const results = await youtubeService.search(searchQuery);
        if (results && results.length > 0) {
          const mapped: FeedItem[] = results.map((track, i) => ({
            postId: `feed_dynamic_${track.id}_${i}`,
            songTitle: track.title,
            artist: track.artist,
            coverUrl: track.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
            audioUrl: track.id,
            caption: `Letras perfectamente sincronizadas para ${track.title} por ${track.artist}. 🔥📻`,
            likes: Math.floor(Math.random() * 85000) + 1200,
            comments: Math.floor(Math.random() * 3200) + 40,
            views: `${(Math.random() * 4 + 1).toFixed(1)}M`,
            creatorHandle: `${track.artist.toLowerCase().replace(/[^a-z0-ptr0-9]/g, '') || 'music'}_fan`,
            uploadDate: new Date().toISOString().split('T')[0]
          }));
          setDynamicTracks(mapped);
          setActiveIndex(0); // Reset snap scroll back to top of lookups
        }
      } catch (err) {
        console.error("Dynamic lookup error inside VerticalMusicFeed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Combined feed lists (searched dynamic lookups or legendary 500 seeds)
  const filteredFeed = useMemo(() => {
    if (searchQuery.trim() && dynamicTracks.length > 0) {
      return dynamicTracks;
    }
    return FEED_SEEDS;
  }, [dynamicTracks, searchQuery]);

  // Handle URL direct sharing parameters (e.g. ?song=feed_track_42)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedSongId = params.get('song');
    if (sharedSongId && filteredFeed.length > 0) {
      const idx = filteredFeed.findIndex(item => item.postId === sharedSongId);
      if (idx !== -1) {
        console.log(`Deep Link discovered! Snapping immediately to shared track index: ${idx}`);
        setActiveIndex(idx);
      }
    }
  }, [filteredFeed]);

  // Resolve current active song item
  const activeItem = useMemo(() => {
    return filteredFeed[activeIndex] || filteredFeed[0] || FEED_SEEDS[0];
  }, [filteredFeed, activeIndex]);

  // Synchronize dynamic background audio play context - Force absolute immediate autoplay on mount and index change
  useEffect(() => {
    if (!activeItem) return;

    playTrack({
      id: activeItem.audioUrl,
      title: activeItem.songTitle,
      artist: activeItem.artist,
      thumbnail: activeItem.coverUrl
    });
  }, [activeIndex, activeItem, playTrack]);

  // Discontinue background streaming when tab is shifted
  useEffect(() => {
    return () => {
      stopTrack();
    };
  }, [stopTrack]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleNextClick = () => {
    const nextIndex = (activeIndex + 1) % filteredFeed.length;
    setActiveIndex(nextIndex);
  };

  return (
    <div className="feed-root select-none">
      
      {/* 1. Header (Translucid Floating Search overlay on top) */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        <FloatingHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          songTitle={activeItem?.songTitle || ''}
          artist={activeItem?.artist || ''}
          coverUrl={activeItem?.coverUrl || ''}
          isPlaying={currentTrack?.id === activeItem?.audioUrl && isPlaying}
          togglePlay={togglePlay}
          onNextClick={handleNextClick}
        />
      </div>

      {/* 2. Optimized Windowed Snap Scroller (Renders only virtual slides near viewport) */}
      <SnapScrollContainer
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
      >
        {filteredFeed.map((item, idx) => {
          const isSelected = idx === activeIndex;
          
          // Virtual window calculation (isNear Render rule)
          // We only mount and load core assets for items within 2 steps of active card
          const isNear = Math.abs(idx - activeIndex) <= 2;
          
          const activeTrackPlaying = isSelected && currentTrack?.id === item.audioUrl && isPlaying;
          const itemLyrics = SYNCED_LYRICS_MOCK[item.audioUrl] || [];

          return (
            <MusicCard
              key={item.postId}
              item={item}
              idx={idx}
              isSelected={isSelected}
              isNear={isNear}
              activeTrackPlaying={activeTrackPlaying}
              currentTime={currentTime}
              duration={duration}
              seekTo={seekTo}
              playTrack={playTrack}
              currentTrackId={currentTrack?.id}
              itemLyrics={itemLyrics}
              progress={progress}
              formatTime={formatTime}
            />
          );
        })}
      </SnapScrollContainer>

    </div>
  );
};
