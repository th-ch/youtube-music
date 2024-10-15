import { createRoute, z } from '@hono/zod-openapi';

import { ipcMain } from 'electron';

import getSongControls from '@/providers/song-controls';

import {
  AuthHeadersSchema,
  type ResponseSongInfo,
  SongInfoSchema,
  GoForwardScheme,
  GoBackSchema,
  SwitchRepeatSchema,
  SetVolumeSchema,
  SetFullscreenSchema,
} from '../scheme';

import type { SongInfo } from '@/providers/song-info';
import type { BackendContext } from '@/types/contexts';
import type { APIServerConfig } from '../../config';
import type { HonoApp } from '../types';
import type { QueueResponse } from '@/types/youtube-music-desktop-internal';

const API_VERSION = 'v1';

const routes = {
  previous: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/previous`,
    summary: 'play previous song',
    description: 'Plays the previous song in the queue',
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),
  next: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/next`,
    summary: 'play next song',
    description: 'Plays the next song in the queue',
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),
  play: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/play`,
    summary: 'Play',
    description: 'Change the state of the player to play',
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),
  pause: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/pause`,
    summary: 'Pause',
    description: 'Change the state of the player to pause',
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),
  togglePlay: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/toggle-play`,
    summary: 'Toggle play/pause',
    description:
      'Change the state of the player to play if paused, or pause if playing',
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),
  like: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/like`,
    summary: 'like song',
    description: 'Set the current song as liked',
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),
  dislike: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/dislike`,
    summary: 'dislike song',
    description: 'Set the current song as disliked',
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),

  goBack: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/go-back`,
    summary: 'go back',
    description: 'Move the current song back by a number of seconds',
    request: {
      headers: AuthHeadersSchema,
      body: {
        description: 'seconds to go back',
        content: {
          'application/json': {
            schema: GoBackSchema,
          },
        },
      },
    },
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),

  goForward: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/go-forward`,
    summary: 'go forward',
    description: 'Move the current song forward by a number of seconds',
    request: {
      headers: AuthHeadersSchema,
      body: {
        description: 'seconds to go forward',
        content: {
          'application/json': {
            schema: GoForwardScheme,
          },
        },
      },
    },
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),

  shuffle: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/shuffle`,
    summary: 'shuffle',
    description: 'Shuffle the queue',
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),
  switchRepeat: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/switch-repeat`,
    summary: 'switch repeat',
    description: 'Switch the repeat mode',
    request: {
      headers: AuthHeadersSchema,
      body: {
        description: 'number of times to click the repeat button',
        content: {
          'application/json': {
            schema: SwitchRepeatSchema,
          },
        },
      },
    },
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),
  setVolume: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/volume`,
    summary: 'set volume',
    description: 'Set the volume of the player',
    request: {
      headers: AuthHeadersSchema,
      body: {
        description: 'volume to set',
        content: {
          'application/json': {
            schema: SetVolumeSchema,
          },
        },
      },
    },
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),
  setFullscreen: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/fullscreen`,
    summary: 'set fullscreen',
    description: 'Set the fullscreen state of the player',
    request: {
      headers: AuthHeadersSchema,
      body: {
        description: 'fullscreen state',
        content: {
          'application/json': {
            schema: SetFullscreenSchema,
          },
        },
      },
    },
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),
  toggleMute: createRoute({
    method: 'post',
    path: `/api/${API_VERSION}/toggle-mute`,
    summary: 'toggle mute',
    description: 'Toggle the mute state of the player',
    responses: {
      204: {
        description: 'Success',
      },
    },
  }),

  getFullscreenState: createRoute({
    method: 'get',
    path: `/api/${API_VERSION}/fullscreen`,
    summary: 'get fullscreen state',
    description: 'Get the current fullscreen state',
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: z.object({
              state: z.boolean(),
            }),
          },
        },
      },
    },
  }),
  queueInfo: createRoute({
    method: 'get',
    path: `/api/${API_VERSION}/queue-info`,
    summary: 'get current queue info',
    description: 'Get the current queue info',
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: z.object({}),
          },
        },
      },
      204: {
        description: 'No queue info',
      },
    },
  }),
  songInfo: createRoute({
    method: 'get',
    path: `/api/${API_VERSION}/song-info`,
    summary: 'get current song info',
    description: 'Get the current song info',
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: SongInfoSchema,
          },
        },
      },
      204: {
        description: 'No song info',
      },
    },
  }),
};

export const register = (
  app: HonoApp,
  { window }: BackendContext<APIServerConfig>,
  songInfoGetter: () => SongInfo | undefined,
) => {
  const controller = getSongControls(window);

  app.openapi(routes.previous, (ctx) => {
    controller.previous();

    ctx.status(204);
    return ctx.body(null);
  });
  app.openapi(routes.next, (ctx) => {
    controller.next();

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
  app.openapi(routes.goBack, (ctx) => {
    const { seconds } = ctx.req.valid('json');
    controller.goBack(seconds);

    ctx.status(204);
    return ctx.body(null);
  });
  app.openapi(routes.goForward, (ctx) => {
    const { seconds } = ctx.req.valid('json');
    controller.goForward(seconds);

    ctx.status(204);
    return ctx.body(null);
  });
  app.openapi(routes.shuffle, (ctx) => {
    controller.shuffle();

    ctx.status(204);
    return ctx.body(null);
  });
  app.openapi(routes.switchRepeat, (ctx) => {
    const { iteration } = ctx.req.valid('json');
    controller.switchRepeat(iteration);

    ctx.status(204);
    return ctx.body(null);
  });
  app.openapi(routes.setVolume, (ctx) => {
    const { volume } = ctx.req.valid('json');
    controller.setVolume(volume);

    ctx.status(204);
    return ctx.body(null);
  });
  app.openapi(routes.setFullscreen, (ctx) => {
    const { state } = ctx.req.valid('json');
    controller.setFullscreen(state);

    ctx.status(204);
    return ctx.body(null);
  });
  app.openapi(routes.toggleMute, (ctx) => {
    controller.muteUnmute();

    ctx.status(204);
    return ctx.body(null);
  });

  app.openapi(routes.getFullscreenState, async (ctx) => {
    const stateResponsePromise = new Promise<boolean>((resolve) => {
      ipcMain.once(
        'ytmd:set-fullscreen',
        (_, isFullscreen: boolean | undefined) => {
          return resolve(!!isFullscreen);
        },
      );

      controller.requestFullscreenInformation();
    });

    const fullscreen = await stateResponsePromise;

    ctx.status(200);
    return ctx.json({ state: fullscreen });
  });
  app.openapi(routes.queueInfo, async (ctx) => {
    const queueResponsePromise = new Promise<QueueResponse>((resolve) => {
      ipcMain.once('ytmd:get-queue-response', (_, queue: QueueResponse) => {
        return resolve(queue);
      });

      controller.requestQueueInformation();
    });

    const info = await queueResponsePromise;

    if (!info) {
      ctx.status(204);
      return ctx.body(null);
    }

    ctx.status(200);
    return ctx.json(info);
  });
  app.openapi(routes.songInfo, (ctx) => {
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
