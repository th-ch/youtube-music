import type { VideoDataChangeValue } from '@/types/player-api-events';

export interface VideoDataChanged {
  name: string;
  videoData?: VideoDataChangeValue;
}
