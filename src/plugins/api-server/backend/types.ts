import { OpenAPIHono as Hono } from '@hono/zod-openapi';
import { serve } from '@hono/node-server';

import type { BackendContext } from '@/types/contexts';
import type { APIServerConfig } from '@/plugins/api-server/config';
import type { SongInfo } from '@/providers/song-info';

export type HonoApp = Hono;
export type BackendType = {
  app?: HonoApp;
  server?: ReturnType<typeof serve>;
  oldConfig?: APIServerConfig;
  songInfo?: SongInfo;

  init: (ctx: BackendContext<APIServerConfig>) => void;
  run: (hostname: string, port: number) => void;
  end: () => void;
}
