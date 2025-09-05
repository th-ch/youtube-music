import { type OpenAPIHono as Hono } from '@hono/zod-openapi';
import { type serve } from '@hono/node-server';

import type { BackendContext } from '@/types/contexts';
import type { SongInfo } from '@/providers/song-info';
import type { LikeType, RepeatMode, VolumeState } from '@/types/datahost-get-state';
import type { APIServerConfig } from '../config';

export type HonoApp = Hono;
export type BackendType = {
  app?: HonoApp;
  server?: ReturnType<typeof serve>;
  oldConfig?: APIServerConfig;
  songInfo?: SongInfo;
  currentRepeatMode?: RepeatMode;
  currentLikeType?: LikeType;
  volumeState?: VolumeState;

  init: (ctx: BackendContext<APIServerConfig>) => void;
  run: (hostname: string, port: number) => void;
  end: () => void;
};
