import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { YouTubeTrack } from '../services/youtubeService';
import { auth, db, signInWithGoogle } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp, 
  increment,
  writeBatch,
  getDoc
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface PlayerContextType {
  currentTrack: YouTubeTrack | null;
  isPlaying: boolean;
  playTrack: (track: YouTubeTrack, playlist?: YouTubeTrack[]) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  togglePlay: () => void;
  volume: number;
  setVolume: (v: number) => void;
  duration: number;
  currentTime: number;
  setProgress: (current: number, total: number) => void;
  seekTo: (time: number) => void;
  seekTarget: number | null;
  user: User | null;
  likedTracks: YouTubeTrack[];
  toggleLike: (track: YouTubeTrack) => Promise<void>;
  getLikeCount: (trackId: string) => number;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  shuffleMode: boolean;
  setShuffleMode: (v: boolean) => void;
  repeatMode: 'off' | 'track' | 'queue';
  setRepeatMode: (v: 'off' | 'track' | 'queue') => void;
  queue: YouTubeTrack[];
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<YouTubeTrack | null>(() => {
    const saved = localStorage.getItem('pureaudio_current_track');
    return saved ? JSON.parse(saved) : null;
  });
  const [queue, setQueue] = useState<YouTubeTrack[]>(() => {
    const saved = localStorage.getItem('pureaudio_queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [shuffledQueue, setShuffledQueue] = useState<YouTubeTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('pureaudio_volume');
    return saved ? parseFloat(saved) : 0.8;
  });
  const [shuffleMode, setShuffleMode] = useState(() => {
    return localStorage.getItem('pureaudio_shuffle') === 'true';
  });
  const [repeatMode, setRepeatMode] = useState<'off' | 'track' | 'queue'>(() => {
    return (localStorage.getItem('pureaudio_repeat') as any) || 'off';
  });

  const [user, setUser] = useState<User | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  const setProgress = useCallback((current: number, total: number) => {
    setCurrentTime(current);
    setDuration(total);
  }, []);

  const seekTo = useCallback((time: number) => {
    setSeekTarget(time);
  }, []);

  const [likedTracks, setLikedTracks] = useState<YouTubeTrack[]>([]);
  const [trackStats, setTrackStats] = useState<Record<string, number>>({});

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('pureaudio_volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('pureaudio_shuffle', shuffleMode.toString());
    if (shuffleMode && queue.length > 0) {
      const shuffled = [...queue].sort(() => Math.random() - 0.5);
      setShuffledQueue(shuffled);
    } else {
      setShuffledQueue([]);
    }
  }, [shuffleMode, queue]);

  useEffect(() => {
    localStorage.setItem('pureaudio_repeat', repeatMode);
  }, [repeatMode]);

  useEffect(() => {
    if (currentTrack) {
      localStorage.setItem('pureaudio_current_track', JSON.stringify(currentTrack));
    }
  }, [currentTrack]);

  useEffect(() => {
    localStorage.setItem('pureaudio_queue', JSON.stringify(queue));
  }, [queue]);

  const activeQueue = shuffleMode && shuffledQueue.length > 0 ? shuffledQueue : queue;

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  // Likes Listener
  useEffect(() => {
    if (!user) {
      setLikedTracks([]);
      return;
    }

    const q = query(collection(db, 'likes'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      const likes = snapshot.docs.map(doc => ({
        id: doc.data().trackId,
        title: doc.data().trackTitle,
        artist: doc.data().trackArtist,
        thumbnail: doc.data().trackThumbnail
      }));
      setLikedTracks(likes);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'likes');
    });
  }, [user]);

  // Track Stats Listener (Global for counting likes)
  useEffect(() => {
    return onSnapshot(collection(db, 'trackStats'), (snapshot) => {
      const stats: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        stats[doc.id] = doc.data().likeCount || 0;
      });
      setTrackStats(stats);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trackStats');
    });
  }, []);

  const playTrack = useCallback((track: YouTubeTrack, playlist?: YouTubeTrack[]) => {
    console.log('Playing track:', track.title, track.id);
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setSeekTarget(null);
    
    if (playlist) {
      setQueue(playlist);
    } else {
      // If no playlist provided, check if track is in current queue
      const inQueue = queue.some(t => t.id === track.id);
      if (!inQueue) {
        setQueue([track]);
      }
    }
  }, [queue]);

  const nextTrack = useCallback(() => {
    if (repeatMode === 'track' && currentTrack) {
      // Small trick to re-trigger currentTrack change if needed 
      // though usually YouTube player handles loop if we tell it.
      // But for simplicity, just re-play same track.
      console.log('Repeating track');
      setCurrentTime(0);
      setSeekTarget(0); 
      return;
    }

    if (!currentTrack || activeQueue.length === 0) return;
    const currentIndex = activeQueue.findIndex(t => t.id === currentTrack.id);
    
    if (currentIndex !== -1) {
      let nextIndex = currentIndex + 1;
      
      if (nextIndex >= activeQueue.length) {
        if (repeatMode === 'queue') {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }

      const next = activeQueue[nextIndex];
      if (next) {
        console.log('Skipping to next track:', next.title);
        setCurrentTrack(next);
        setIsPlaying(true);
        setCurrentTime(0);
        setSeekTarget(null);
      }
    }
  }, [currentTrack, activeQueue, repeatMode]);

  const prevTrack = useCallback(() => {
    if (!currentTrack || activeQueue.length === 0) return;
    const currentIndex = activeQueue.findIndex(t => t.id === currentTrack.id);
    
    if (currentIndex !== -1) {
      let prevIndex = currentIndex - 1;
      
      if (prevIndex < 0) {
        if (repeatMode === 'queue') {
          prevIndex = activeQueue.length - 1;
        } else {
          prevIndex = 0;
        }
      }

      const prev = activeQueue[prevIndex];
      if (prev) {
        setCurrentTrack(prev);
        setIsPlaying(true);
        setCurrentTime(0);
        setSeekTarget(null);
      }
    }
  }, [currentTrack, activeQueue, repeatMode]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const toggleLike = async (track: YouTubeTrack) => {
    if (!user) {
      await login();
      return;
    }

    const isLiked = likedTracks.some(t => t.id === track.id);
    const likeId = `${user.uid}_${track.id}`;
    const batch = writeBatch(db);

    try {
      if (isLiked) {
        batch.delete(doc(db, 'likes', likeId));
        batch.set(doc(db, 'trackStats', track.id), {
          likeCount: increment(-1)
        }, { merge: true });
      } else {
        batch.set(doc(db, 'likes', likeId), {
          userId: user.uid,
          trackId: track.id,
          trackTitle: track.title,
          trackArtist: track.artist || '',
          trackThumbnail: track.thumbnail || '',
          createdAt: serverTimestamp()
        });
        batch.set(doc(db, 'trackStats', track.id), {
          likeCount: increment(1)
        }, { merge: true });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `likes/${likeId}`);
    }
  };

  const getLikeCount = (trackId: string) => {
    return trackStats[trackId] || 0;
  };

  const login = async () => {
    await signInWithGoogle();
  };

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <PlayerContext.Provider value={{ 
      currentTrack, 
      isPlaying, 
      playTrack, 
      nextTrack,
      prevTrack,
      togglePlay, 
      volume, 
      setVolume,
      currentTime,
      duration,
      setProgress,
      seekTo,
      seekTarget,
      user,
      likedTracks,
      toggleLike,
      getLikeCount,
      login,
      logout,
      queue,
      shuffleMode,
      setShuffleMode,
      repeatMode,
      setRepeatMode
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}
