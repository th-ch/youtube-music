import { createRoute, z } from '@hono/zod-openapi';
import { verify } from 'hono/jwt';

import { type NodeWebSocket } from '@hono/node-ws';

import {
  registerCallback,
  type SongInfo,
  SongInfoEvent,
} from '@/providers/song-info';

import { AuthStrategy } from '@/plugins/api-server/config';

import { API_VERSION } from '../api-version';

import type { WSContext } from 'hono/ws';
import type { Context, Next } from 'hono';
import type { RepeatMode, VolumeState } from '@/types/datahost-get-state';
import type { HonoApp } from '../types';
import type { BackendContext } from '@/types/contexts';
import type { APIServerConfig } from '@/plugins/api-server/config';

enum DataTypes {
  PlayerInfo = 'PLAYER_INFO',
  VideoChanged = 'VIDEO_CHANGED',
  PlayerStateChanged = 'PLAYER_STATE_CHANGED',
  PositionChanged = 'POSITION_CHANGED',
  VolumeChanged = 'VOLUME_CHANGED',
  RepeatChanged = 'REPEAT_CHANGED',
  ShuffleChanged = 'SHUFFLE_CHANGED',
}

type PlayerState = {
  song?: SongInfo;
  isPlaying: boolean;
  muted: boolean;
  position: number;
  volume: number;
  repeat: RepeatMode;
  shuffle: boolean;
};

export const register = (
  app: HonoApp,
  { getConfig, ipc }: BackendContext<APIServerConfig>,
  { upgradeWebSocket }: NodeWebSocket,
) => {
  let volumeState: VolumeState | undefined = undefined;
  let repeat: RepeatMode = 'NONE';
  let shuffle = false;
  let lastSongInfo: SongInfo | undefined = undefined;

  const sockets = new Set<WSContext<WebSocket>>();

  const send = (type: DataTypes, state: Partial<PlayerState>) => {
    sockets.forEach((socket) =>
      socket.send(JSON.stringify({ type, ...state })),
    );
  };

  const createPlayerState = ({
    songInfo,
    volumeState,
    repeat,
    shuffle,
  }: {
    songInfo?: SongInfo;
    volumeState?: VolumeState;
    repeat: RepeatMode;
    shuffle: boolean;
  }): PlayerState => ({
    song: songInfo,
    isPlaying: songInfo ? !songInfo.isPaused : false,
    muted: volumeState?.isMuted ?? false,
    position: songInfo?.elapsedSeconds ?? 0,
    volume: volumeState?.state ?? 100,
    repeat,
    shuffle,
  });

  registerCallback((songInfo, event) => {
    if (event === SongInfoEvent.VideoSrcChanged) {
      send(DataTypes.VideoChanged, { song: songInfo, position: 0 });
    }

    if (event === SongInfoEvent.PlayOrPaused) {
      send(DataTypes.PlayerStateChanged, {
        isPlaying: !(songInfo?.isPaused ?? true),
        position: songInfo.elapsedSeconds,
      });
    }

    if (event === SongInfoEvent.TimeChanged) {
      send(DataTypes.PositionChanged, { position: songInfo.elapsedSeconds });
    }

    lastSongInfo = { ...songInfo };
  });

  ipc.on('ytmd:volume-changed', (newVolumeState: VolumeState) => {
    volumeState = newVolumeState;
    send(DataTypes.VolumeChanged, {
      volume: volumeState.state,
      muted: volumeState.isMuted,
    });
  });

  ipc.on('ytmd:repeat-changed', (mode: RepeatMode) => {
    repeat = mode;
    send(DataTypes.RepeatChanged, { repeat });
  });

  ipc.on('ytmd:seeked', (t: number) => {
    send(DataTypes.PositionChanged, { position: t });
  });

  ipc.on('ytmd:shuffle-changed', (newShuffle: boolean) => {
    shuffle = newShuffle;
    send(DataTypes.ShuffleChanged, { shuffle });
  });

  app.openapi(
    createRoute({
      method: 'get',
      path: `/api/${API_VERSION}/ws`,
      summary: 'websocket endpoint',
      description: 'WebSocket endpoint for real-time updates',
      request: {
        query: z.object({
          token: z.string().optional(),
        }),
      },
      responses: {
        101: {
          description: 'Switching Protocols',
        },
      },
    }),
    upgradeWebSocket((ctx) => ({
      async onOpen(_, ws) {
        const config = await getConfig();

        if (config.authStrategy !== AuthStrategy.NONE) {
          const token = ctx.req.query('token');

          if (!token) {
            ws.close(1008, 'Unauthorized');
            return;
          }

          try {
            const payload = await verify(token, config.secret);

            if (!config.authorizedClients.includes(payload.id as string)) {
              ws.close(1008, 'Unauthorized');
              return;
            }
          } catch {
            ws.close(1008, 'Unauthorized');
            return;
          }
        }

        // "Unsafe argument of type `WSContext<WebSocket>` assigned to a parameter of type `WSContext<WebSocket>`. (@typescript-eslint/no-unsafe-argument)" ????? what?
        sockets.add(ws as WSContext<WebSocket>);

        ws.send(
          JSON.stringify({
            type: DataTypes.PlayerInfo,
            ...createPlayerState({
              songInfo: lastSongInfo,
              volumeState,
              repeat,
              shuffle,
            }),
          }),
        );
      },

      onClose(_, ws) {
        sockets.delete(ws as WSContext<WebSocket>);
      },
    })) as (ctx: Context, next: Next) => Promise<Response>,
  );
};
