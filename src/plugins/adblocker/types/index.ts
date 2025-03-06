export const blockers = {
  WithBlocklists: 'With blocklists',
  InPlayer: 'In player',
  AdSpeedup: 'Ad speedup',
  EnhancedAdBlocker: 'Enhanced ad blocker',
  CombinedBlocker: 'Combined blocker', // New option that uses all methods together
} as const;

export type BlockerType = (typeof blockers)[keyof typeof blockers];

export interface EnhancedAdBlockerSettings {
  adPlaybackSpeed: number;
  muteAds: boolean;
  showIndicator: boolean;
  aggressiveMode: boolean;
  // New settings
  autoSkipOverlays: boolean;
  blockYoutubeAnalytics: boolean;
  hidePromos: boolean;
  enableLogging: boolean;
}

export interface AdBlockStats {
  networkRequestsBlocked: number;
  adsSkipped: number;
  overlaysRemoved: number;
  lastActivity: number;
}
