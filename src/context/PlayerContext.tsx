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

interface Artist {
  id: string; // channelId or similar
  name: string;
  thumbnail: string;
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
  isShuffle: boolean;
  toggleShuffle: () => void;
  repeatMode: 'none' | 'all' | 'one';
  toggleRepeat: () => void;
  user: User | null;
  likedTracks: YouTubeTrack[];
  toggleLike: (track: YouTubeTrack) => Promise<void>;
  getLikeCount: (trackId: string) => number;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  queue: YouTubeTrack[];
  followedArtists: Artist[];
  toggleFollowArtist: (artist: Artist) => Promise<void>;
  notification: {message: string, type: 'success' | 'info'} | null;
  notify: (message: string, type?: 'success' | 'info') => void;
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [followedArtists, setFollowedArtists] = useState<Artist[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  const notify = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const setProgress = useCallback((current: number, total: number) => {
    setCurrentTime(current);
    setDuration(total);
  }, []);

  const seekTo = useCallback((time: number) => {
    setSeekTarget(time);
  }, []);

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

  // Artist Follows Listener
  useEffect(() => {
    if (!user) {
      setFollowedArtists([]);
      return;
    }

    const q = query(collection(db, 'artistFollows'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      const artists = snapshot.docs.map(doc => ({
        id: doc.data().artistId,
        name: doc.data().artistName,
        thumbnail: doc.data().artistThumbnail
      }));
      setFollowedArtists(artists);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'artistFollows');
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
    } else if (likedTracks.some(t => t.id === track.id)) {
      setQueue(likedTracks);
    } else {
      setQueue([track]);
    }
  }, [likedTracks]);

  const nextTrack = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    
    if (repeatMode === 'one') {
      seekTo(0);
      return;
    }

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    let nextIndex;

    if (isShuffle) {
      // Pick a random index that isn't the current one if possible
      if (queue.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * queue.length);
        } while (nextIndex === currentIndex);
      } else {
        nextIndex = 0;
      }
    } else {
      nextIndex = (currentIndex + 1) % queue.length;
      // If we reached the end and repeat is none, stop playing
      if (nextIndex === 0 && repeatMode === 'none' && currentIndex !== -1) {
        setIsPlaying(false);
        return;
      }
    }

    const next = queue[nextIndex];
    if (next) {
      console.log('Skipping to next track:', next.title);
      setCurrentTrack(next);
      setIsPlaying(true);
      setCurrentTime(0);
      setSeekTarget(null);
    }
  }, [currentTrack, queue, isShuffle, repeatMode, seekTo]);

  const prevTrack = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    
    // If we're more than 3 seconds in, restart the song instead of going back
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1) {
      const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
      const prev = queue[prevIndex];
      if (prev) {
        setCurrentTrack(prev);
        setIsPlaying(true);
        setCurrentTime(0);
        setSeekTarget(null);
      }
    }
  }, [currentTrack, queue, currentTime, seekTo]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  }, []);

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

  const toggleFollowArtist = async (artist: Artist) => {
    if (!user) {
      await login();
      return;
    }

    const isFollowing = followedArtists.some(a => a.name === artist.name);
    const followId = `${user.uid}_${artist.name.replace(/\s+/g, '_')}`;

    try {
      if (isFollowing) {
        await deleteDoc(doc(db, 'artistFollows', followId));
        notify(`Has dejado de seguir a ${artist.name}`, 'info');
      } else {
        await setDoc(doc(db, 'artistFollows', followId), {
          userId: user.uid,
          artistId: artist.id || '',
          artistName: artist.name,
          artistThumbnail: artist.thumbnail || '',
          createdAt: serverTimestamp()
        });
        notify(`Album virtual de ${artist.name} añadido a tu biblioteca`, 'success');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `artistFollows/${followId}`);
    }
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
      isShuffle,
      toggleShuffle,
      repeatMode,
      toggleRepeat,
      user,
      likedTracks,
      toggleLike,
      getLikeCount,
      login,
      logout,
      queue,
      followedArtists,
      toggleFollowArtist,
      notification,
      notify
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
