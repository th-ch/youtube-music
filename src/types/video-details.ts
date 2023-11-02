export interface VideoDetails {
  video_id: string;
  author: string;
  title: string;
  isPlayable: boolean;
  errorCode: null;
  video_quality: string;
  video_quality_features: unknown[];
  list: string;
  backgroundable: boolean;
  eventId: string;
  cpn: string;
  isLive: boolean;
  isWindowedLive: boolean;
  isManifestless: boolean;
  allowLiveDvr: boolean;
  isListed: boolean;
  isMultiChannelAudio: boolean;
  hasProgressBarBoundaries: boolean;
  isPremiere: boolean;
  itct: string;
  progressBarStartPositionUtcTimeMillis: number | null;
  progressBarEndPositionUtcTimeMillis: number | null;
  paidContentOverlayDurationMs: number;
}
