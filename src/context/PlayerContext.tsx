import React, { createContext, useContext, useState, useEffect } from 'react';
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
  user: User | null;
  likedTracks: YouTubeTrack[];
  toggleLike: (track: YouTubeTrack) => Promise<void>;
  getLikeCount: (trackId: string) => number;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<YouTubeTrack | null>(null);
  const [queue, setQueue] = useState<YouTubeTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('pureaudio_volume');
    return saved ? parseFloat(saved) : 0.8;
  });
  const [user, setUser] = useState<User | null>(null);
  const [likedTracks, setLikedTracks] = useState<YouTubeTrack[]>([]);
  const [trackStats, setTrackStats] = useState<Record<string, number>>({});

  // Sync volume to localStorage
  useEffect(() => {
    localStorage.setItem('pureaudio_volume', volume.toString());
  }, [volume]);

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

  const playTrack = (track: YouTubeTrack, playlist?: YouTubeTrack[]) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    if (playlist) {
      setQueue(playlist);
    } else if (likedTracks.some(t => t.id === track.id)) {
      setQueue(likedTracks);
    }
  };

  const nextTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % queue.length;
      const next = queue[nextIndex];
      if (next) {
        setCurrentTrack(next);
        setIsPlaying(true);
      }
    }
  };

  const prevTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1) {
      const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
      const prev = queue[prevIndex];
      if (prev) {
        setCurrentTrack(prev);
        setIsPlaying(true);
      }
    }
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

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
      user,
      likedTracks,
      toggleLike,
      getLikeCount,
      login,
      logout
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
