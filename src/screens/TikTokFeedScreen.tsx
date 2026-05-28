import React from 'react';
import { VerticalMusicFeed } from '../components/TikTokFeed/VerticalMusicFeed';

interface TikTokFeedScreenProps {
  setActiveTab?: (tab: string) => void;
}

export default function TikTokFeedScreen({ setActiveTab }: TikTokFeedScreenProps = {}) {
  // TikTokFeedScreen delegates directly to the modular VerticalMusicFeed orchestrator
  return <VerticalMusicFeed />;
}
