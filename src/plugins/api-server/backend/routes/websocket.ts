import { ipcMain } from 'electron';
import { createRoute } from '@hono/zod-openapi';

import { type NodeWebSocket } from '@hono/node-ws';

import {
  registerCallback,
  type SongInfo,
  SongInfoEvent,
} from '@/providers/song-info';

import { API_VERSION } from '../api-version';

import type { WSContext } from 'hono/ws';
import type { Context, Next } from 'hono';
import type { RepeatMode, VolumeState } from '@/types/datahost-get-state';
import type { HonoApp } from '../types';

enum DataTypes {
  PlayerInfo = 'PLAYER_INFO',
  VideoChanged = 'VIDEO_CHANGED',
  PlayerStateChanged = 'PLAYER_STATE_CHANGED',
  PositionChanged = 'POSITION_CHANGED',
  VolumeChanged = 'VOLUME_CHANGED',
  RepeatChanged = 'REPEAT_CHANGED',
}

type PlayerState = {
  song?: SongInfo;
  isPlaying: boolean;
  muted: boolean;
  position: number;
  volume: number;
  repeat: RepeatMode;
};

export const register = (app: HonoApp, nodeWebSocket: NodeWebSocket) => {
  let volumeState: VolumeState | undefined = undefined;
  let repeat: RepeatMode = 'NONE';
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
  }: {
    songInfo?: SongInfo;
    volumeState?: VolumeState;
    repeat: RepeatMode;
  }): PlayerState => ({
    song: songInfo,
    isPlaying: songInfo ? !songInfo.isPaused : false,
    muted: volumeState?.isMuted ?? false,
    position: songInfo?.elapsedSeconds ?? 0,
    volume: volumeState?.state ?? 100,
    repeat,
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

  ipcMain.on('ytmd:volume-changed', (_, newVolumeState: VolumeState) => {
    volumeState = newVolumeState;
    send(DataTypes.VolumeChanged, {
      volume: volumeState.state,
      muted: volumeState.isMuted,
    });
  });

  ipcMain.on('ytmd:repeat-changed', (_, mode: RepeatMode) => {
    repeat = mode;
    send(DataTypes.RepeatChanged, { repeat });
  });

  ipcMain.on('ytmd:seeked', (_, t: number) => {
    send(DataTypes.PositionChanged, { position: t });
  });

  app.openapi(
    createRoute({
      method: 'get',
      path: `/api/${API_VERSION}/ws`,
      summary: 'websocket endpoint',
      description: 'WebSocket endpoint for real-time updates',
      responses: {
        101: {
          description: 'Switching Protocols',
        },
      },
    }),
    nodeWebSocket.upgradeWebSocket(() => ({
      onOpen(_, ws) {
        // "Unsafe argument of type `WSContext<WebSocket>` assigned to a parameter of type `WSContext<WebSocket>`. (@typescript-eslint/no-unsafe-argument)" ????? what?
        sockets.add(ws as WSContext<WebSocket>);

        ws.send(
          JSON.stringify({
            type: DataTypes.PlayerInfo,
            ...createPlayerState({
              songInfo: lastSongInfo,
              volumeState,
              repeat,
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
