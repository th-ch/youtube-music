import { type UpgradeWebSocket, type WSContext } from 'hono/ws';
import { ipcMain } from 'electron';

import { type BackendContext } from '@/types/contexts';
import registerCallback, { type SongInfo } from '@/providers/song-info';

import type { RepeatMode, VolumeState } from '@/types/datahost-get-state';
import type { HonoApp } from '../types';
import type { APIServerConfig } from '../../config';

enum DataTypes {
  PLAYER_STATE = 'PLAYER_STATE',
}

type PlayerState = {
  song: SongInfo;
  isPlaying: boolean;
  muted: boolean;
  position: number;
  volume: number;
  repeat: RepeatMode;
};

let volumeState: VolumeState;
let repeat: RepeatMode = 'NONE' as RepeatMode;

export const register = (
  app: HonoApp,
  _: BackendContext<APIServerConfig>,
  upgradeWebSocket: UpgradeWebSocket<WebSocket>,
) => {
  const sockets = new Set<WSContext<WebSocket>>();

  let lastSongInfo: SongInfo | null;

  function send(state: Partial<PlayerState>) {
    sockets.forEach((socket) =>
      socket.send(JSON.stringify({ type: DataTypes.PLAYER_STATE, ...state })),
    );
  }

  const createPlayerState = ({
    songInfo,
    volume,
    repeat,
    muted,
  }: {
    songInfo: SongInfo | null;
    volume: number;
    repeat: RepeatMode;
    muted: boolean;
  }) =>
    JSON.stringify({
      type: DataTypes.PLAYER_STATE,
      song: songInfo,
      isPlaying: songInfo ? !songInfo.isPaused : false,
      muted: muted ?? false,
      position: songInfo?.elapsedSeconds ?? 0,
      volume,
      repeat,
    });

  registerCallback((songInfo) => {
    if (lastSongInfo?.videoId !== songInfo.videoId) {
      send({ song: songInfo, position: 0 });
    }

    if (lastSongInfo?.isPaused !== songInfo.isPaused) {
      send({
        isPlaying: !(songInfo?.isPaused ?? true),
        position: songInfo.elapsedSeconds,
      });
    }

    // Only send the current position every 5 seconds
    if ((songInfo.elapsedSeconds ?? 0) % 5 === 0) {
      send({ position: songInfo.elapsedSeconds });
    }

    lastSongInfo = { ...songInfo };
  });

  ipcMain.on(
    'ytmd:volume-changed',
    (_, newVolumeState: { state: number; isMuted: boolean }) => {
      volumeState = newVolumeState;
      send({ volume: volumeState.state, muted: volumeState.isMuted });
    },
  );

  ipcMain.on('ytmd:repeat-changed', (_, mode: RepeatMode) => {
    repeat = mode;
    send({ repeat });
  });

  ipcMain.on('ytmd:seeked', (_, t: number) => {
    send({ position: t });
  });

  app.get(
    '/api/ws',
    upgradeWebSocket(() => ({
      onOpen(_, ws) {
        ws.send(
          createPlayerState({
            songInfo: lastSongInfo,
            volume: volumeState.state,
            repeat,
            muted: volumeState.isMuted,
          }),
        );
        sockets.add(ws);
      },

      onClose(_, ws) {
        sockets.delete(ws);

        console.log(sockets);
      },
    })),
  );
};
