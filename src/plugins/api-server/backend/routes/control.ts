import { createRoute } from '@hono/zod-openapi';

import getSongControls from '@/providers/song-controls';

import { AuthHeadersSchema, ResponseSongInfo, SongInfoSchema } from '../scheme';

import type { SongInfo } from '@/providers/song-info';
import type { BackendContext } from '@/types/contexts';
import type { APIServerConfig } from '../../config';
import type { HonoApp } from '../types';

const routes = {
  previous: createRoute({
    method: 'post',
    path: '/api/previous',
    summary: 'play previous song',
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
  next: createRoute({
    method: 'post',
    path: '/api/next',
    summary: 'play next song',
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
  like: createRoute({
    method: 'post',
    path: '/api/like',
    summary: 'like song',
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
  dislike: createRoute({
    method: 'post',
    path: '/api/dislike',
    summary: 'play dislike song',
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

  info: createRoute({
    method: 'get',
    path: '/api/info',
    summary: 'get current song info',
    description: '',
    request: {
      headers: AuthHeadersSchema,
    },
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: SongInfoSchema,
          }
        },
      },
      204: {
        description: 'No song info',
      },
    },
  }),
};

export const register = (app: HonoApp, { window }: BackendContext<APIServerConfig>, songInfoGetter: () => SongInfo | undefined) => {
  const controller = getSongControls(window);

  app.openapi(routes.previous, (ctx) => {
    controller.previous();

    ctx.status(204);
    return ctx.body(null);
  });
  app.openapi(routes.previous, (ctx) => {
    controller.previous();

    ctx.status(204);
    return ctx.body(null);
  });
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
  app.openapi(routes.like, (ctx) => {
    controller.like();

    ctx.status(204);
    return ctx.body(null);
  });
  app.openapi(routes.dislike, (ctx) => {
    controller.dislike();

    ctx.status(204);
    return ctx.body(null);
  });

  app.openapi(routes.info, (ctx) => {
    const info = songInfoGetter();

    if (!info) {
      ctx.status(204);
      return ctx.body(null);
    }

    const body = { ...info };
    delete body.image;

    ctx.status(200);
    return ctx.json(body satisfies ResponseSongInfo);
  });
};
