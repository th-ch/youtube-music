import { type UpgradeWebSocket, type WSContext } from 'hono/ws';
import { ipcMain } from 'electron';

import { type BackendContext } from '@/types/contexts';
import registerCallback, { type SongInfo } from '@/providers/song-info';

import type { RepeatMode, VolumeState } from '@/types/datahost-get-state';
import type { HonoApp } from '../types';
import type { APIServerConfig } from '../../config';

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

export const register = (
  app: HonoApp,
  _: BackendContext<APIServerConfig>,
  upgradeWebSocket: UpgradeWebSocket<WebSocket>,
) => {
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

  registerCallback((songInfo) => {
    if (lastSongInfo?.videoId !== songInfo.videoId) {
      send(DataTypes.VideoChanged, { song: songInfo, position: 0 });
    }

    if (lastSongInfo?.isPaused !== songInfo.isPaused) {
      send(DataTypes.PlayerStateChanged, {
        isPlaying: !(songInfo?.isPaused ?? true),
        position: songInfo.elapsedSeconds,
      });
    }

    send(DataTypes.PositionChanged, { position: songInfo.elapsedSeconds });

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

  app.get(
    '/api/ws',
    upgradeWebSocket(() => ({
      onOpen(_, ws) {
        sockets.add(ws);

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
        sockets.delete(ws);

        console.log(sockets);
      },
    })),
  );
};
