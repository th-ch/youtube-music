import { createRoute } from '@hono/zod-openapi';

import getSongControls from '@/providers/song-controls';

import { AuthHeadersSchema } from '../scheme';

import type { BackendContext } from '@/types/contexts';
import type { APIServerConfig } from '../../config';
import type { HonoApp } from '../types';

const routes = {
  play: createRoute({
    method: 'post',
    path: '/api/play',
    summary: 'Play',
    description: '',
    request: {
      headers: AuthHeadersSchema,
    },
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),
  pause: createRoute({
    method: 'post',
    path: '/api/pause',
    summary: 'Pause',
    description: '',
    request: {
      headers: AuthHeadersSchema,
    },
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),
  togglePlay: createRoute({
    method: 'post',
    path: '/api/toggle',
    summary: 'Toggle play/pause',
    description: '',
    request: {
      headers: AuthHeadersSchema,
    },
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),
};

export const register = (app: HonoApp, { window }: BackendContext<APIServerConfig>) => {
  const controller = getSongControls(window);

  app.openapi(routes.play, (ctx) => {
    controller.play();

    ctx.status(204);
    return ctx.body(null);
  });
  app.openapi(routes.pause, (ctx) => {
    controller.pause();

    ctx.status(204);
    return ctx.body(null);
  });
  app.openapi(routes.togglePlay, (ctx) => {
    controller.playPause();

    ctx.status(204);
    return ctx.body(null);
  });
};
