export const blockers = {
  WithBlocklists: 'With blocklists',
  InPlayer: 'In player',
  AdSpeedup: 'Ad speedup',
} as const;

export type BlockerType = typeof blockers[keyof typeof blockers];
