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

export interface Artist {
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
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
  t: (key: string) => string;
}

const translations = {
  es: {
    home: 'Inicio',
    search: 'Buscar',
    library: 'Biblioteca',
    greetings: 'Buenas noches',
    ai_mood: 'Magia de IA',
    ai_mix: 'Tu mezcla de IA',
    target_age: 'Edad objetivo',
    magic: 'Magia',
    searching: 'Buscando...',
    lyrics: 'Letras',
    no_lyrics: 'No hay letras disponibles para esta obra maestra.',
    summoning_lyrics: 'Invocando letras...',
    lyrics_by: 'Letras proporcionadas por PureAudio AI',
    share: 'Compartir',
    save_liked: 'Guardar en Canciones que te gustan',
    now_playing: 'Sonando ahora',
    play_all: 'Reproducir todo',
    something_wrong: 'Algo salió mal',
    retry: 'Reintentar',
    search_placeholder: 'Música para...',
    age_kid: 'Niño',
    age_teen: 'Joven',
    age_genz: 'Gen Z',
    age_millennial: 'Millennial',
    age_classic: 'Clásico',
    link_copied: '¡Enlace copiado al portapapeles!',
    ai_mood_desc: 'Describe cómo te sientes o qué estás haciendo, y deja que Gemini cree la vibra perfecta para ti.',
    following: 'Siguiendo',
    follow_artist: 'Seguir artista',
    unfollow: 'Dejar de seguir',
    browse_all: 'Explorar todo',
    sign_in_sync: 'Inicia sesión para sincronizar tu biblioteca',
    premium_member: 'Miembro Premium',
    no_results: 'No se encontraron resultados para',
    check_spelling: 'Por favor revisa tu ortografía o intenta una búsqueda más general.',
    cat_all: 'Todo',
    cat_music: 'Música',
    cat_podcasts: 'Podcasts',
    cat_audiobooks: 'Audiolibros',
    jump_back_in: 'Volver a escuchar',
    show_all: 'Ver todo',
    mood: 'Estado de ánimo',
    followed_msg: 'Artista seguido correctamente',
    unfollowed_msg: 'Dejado de seguir correctamente',
    liked_songs: 'Canciones que te gustan',
    playlist: 'Lista de reproducción',
    songs: 'canciones',
    artist_album: 'Álbum del artista',
    create_playlist: 'Crea tu primera lista',
    easy_help: 'Es fácil, te ayudaremos',
    browse_tracks: 'Explorar pistas',
    log_in: 'Iniciar sesión',
    tap_to_play: 'Toca una canción para reproducir',
    followed_artists: 'Artistas que sigues',
    followed: 'seguidos',
    find_artists: 'Busca artistas para seguir',
    fav_appear_here: 'Tus artistas favoritos aparecerán aquí',
    sync_library: 'Inicia sesión para sincronizar tu biblioteca',
    songs_appear_here: 'Las canciones que te gusten aparecerán aquí',
    tap_heart_help: 'Toca el corazón para añadir una canción a mi biblioteca',
    back_to_library: 'Volver a Biblioteca',
    virtual_album: 'Álbum Virtual',
    loading_tracks: 'Cargando pistas...',
    tracks: 'pistas'
  },
  en: {
    home: 'Home',
    search: 'Search',
    library: 'Library',
    greetings: 'Good evening',
    ai_mood: 'AI Mood Magic',
    ai_mix: 'Your AI Mix',
    target_age: 'Target Age',
    magic: 'Magic',
    searching: 'Searching...',
    lyrics: 'Lyrics',
    no_lyrics: 'No lyrics available for this masterpiece.',
    summoning_lyrics: 'Summoning Lyrics...',
    lyrics_by: 'Lyrics provided by PureAudio AI',
    share: 'Share',
    save_liked: 'Save to Liked Songs',
    now_playing: 'Now Playing',
    play_all: 'Play All',
    something_wrong: 'Something went wrong',
    retry: 'Retry',
    search_placeholder: 'Music for...',
    age_kid: 'Kid',
    age_teen: 'Teen',
    age_genz: 'Gen Z',
    age_millennial: 'Millennial',
    age_classic: 'Classic',
    link_copied: 'Link copied to clipboard!',
    ai_mood_desc: "Describe how you feel or what you're doing, and let Gemini create the perfect vibe for you.",
    following: 'Following',
    follow_artist: 'Follow Artist',
    unfollow: 'Unfollow',
    browse_all: 'Browse all',
    sign_in_sync: 'Sign in to sync your library',
    premium_member: 'Premium Member',
    no_results: 'No results found for',
    check_spelling: 'Please check your spelling or try a more general search.',
    cat_all: 'All',
    cat_music: 'Music',
    cat_podcasts: 'Podcasts',
    cat_audiobooks: 'Audiobooks',
    jump_back_in: 'Jump back in',
    show_all: 'Show all',
    mood: 'Mood',
    followed_msg: 'Artist added to your library',
    unfollowed_msg: 'Artist removed from your library',
    liked_songs: 'Liked Songs',
    playlist: 'Playlist',
    songs: 'songs',
    artist_album: 'Artist Album',
    create_playlist: 'Create your first playlist',
    easy_help: "It's easy, we'll help you",
    browse_tracks: 'Browse tracks',
    log_in: 'Log in',
    tap_to_play: 'Tap a song to play',
    followed_artists: 'Followed Artists',
    followed: 'followed',
    find_artists: 'Find artists to follow',
    fav_appear_here: 'Your favorite artists will appear here',
    sync_library: 'Log in to sync your library',
    songs_appear_here: 'Songs you like will appear here',
    tap_heart_help: 'Tap the heart to add a song to your library',
    back_to_library: 'Back to Library',
    virtual_album: 'Virtual Album',
    loading_tracks: 'Loading tracks...',
    tracks: 'tracks'
  },
};

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
  const [language, setLanguage] = useState<'es' | 'en'>(() => {
    const saved = localStorage.getItem('pureaudio_lang');
    return (saved as 'es' | 'en') || 'es';
  });

  const t = useCallback((key: string) => {
    return (translations[language] as any)[key] || key;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('pureaudio_lang', language);
  }, [language]);

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
        notify(t('unfollowed_msg'), 'info');
      } else {
        await setDoc(doc(db, 'artistFollows', followId), {
          userId: user.uid,
          artistId: artist.id || '',
          artistName: artist.name,
          artistThumbnail: artist.thumbnail || '',
          createdAt: serverTimestamp()
        });
        notify(t('followed_msg'), 'success');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `artistFollows/${followId}`);
    }
  };

  const login = async () => {
    try {
      await signInWithGoogle();
      notify('¡Sesión iniciada con éxito!', 'success');
    } catch (e: any) {
      console.error('Login error:', e);
      notify('Error al iniciar sesión con Google.', 'info');
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      notify('Sesión cerrada correctamente.', 'info');
    } catch (e: any) {
      console.error('Logout error:', e);
    }
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
      notify,
      language,
      setLanguage,
      t
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
