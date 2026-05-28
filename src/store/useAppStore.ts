import { create } from 'zustand';

export interface SoundtrackItem {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface AppState {
  soundtrackToUse: SoundtrackItem | null;
  setSoundtrackToUse: (item: SoundtrackItem | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  soundtrackToUse: null,
  setSoundtrackToUse: (item) => set({ soundtrackToUse: item }),
}));
