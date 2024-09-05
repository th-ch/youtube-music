import type { QueueItem } from '@/types/datahost-get-state';

export interface QueueResponse {
  items?: QueueItem[];
  autoPlaying?: boolean;
  continuation?: string;
}

export interface WatchNextResponse {
  playerOverlays: {
    playerOverlayRenderer: {
      browserMediaSession: {
        browserMediaSessionRenderer: {
          album: {
            runs: { text: string; }[]
          }
        }
      }
    }
  };
}
