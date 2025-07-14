import WebSocket, { WebSocketServer } from 'ws';
import { BackendContext } from '@/types/contexts';
import { APIWebsocketConfig } from '../../config';
import registerCallback, { SongInfo } from '@/providers/song-info';
import getSongControls from '@/providers/song-controls';
import { ipcMain } from 'electron';
import { RepeatMode } from '@/types/datahost-get-state';

let websocket: WebSocketServer | null = null;

let volume: number = 0;
let muted = false;
let repeat: RepeatMode = 'NONE' as RepeatMode;

type PlayerState = {
  song: SongInfo;
  isPlaying: boolean;
  muted: boolean;
  position: number;
  volume: number;
  repeat: RepeatMode;
};

function createPlayerState(
  songInfo: SongInfo | null,
  volume: number,
  repeat: RepeatMode,
  muted: boolean,
) {
  return JSON.stringify({
    type: 'PLAYER_STATE',
    song: songInfo,
    isPlaying: songInfo ? !songInfo.isPaused : false,
    muted: muted ?? false,
    position: songInfo?.elapsedSeconds ?? 0,
    volume,
    repeat,
  });
}

export const register = async ({
  window,
  getConfig,
}: BackendContext<APIWebsocketConfig>) => {
  const config = await getConfig();
  const sockets = new Set<WebSocket>();
  function send(state: Partial<PlayerState>) {
    console.log('Sending state:', state);
    sockets.forEach((socket) =>
      socket.send(JSON.stringify({ type: 'PLAYER_STATE', ...state })),
    );
  }

  volume = config.volume;

  let lastSongInfo: SongInfo | null = null;

  const controller = getSongControls(window);

  function setLoopStatus(status: RepeatMode) {
      const switches = [
        'NONE','ALL','ONE'
      ] as RepeatMode[]

      const currentIndex = switches.indexOf(repeat)
      const targetIndex = switches.indexOf(status)

      const delta = (targetIndex-currentIndex+3)%3
      controller.switchRepeat(delta);
  }
  

  ipcMain.on('ytmd:volume-changed', (_, newVolume) => {
    volume = newVolume;
    send({ volume });
  });

  ipcMain.on('ytmd:repeat-changed', (_, mode: RepeatMode) => {
    repeat = mode;
    send({ repeat });
  });

  ipcMain.on('ytmd:seeked', (_, t: number) => {
    send({ position: t });
  });

  ipcMain.on("api-websocket:muted-changed-to", (_, isMuted: boolean) => {
    muted = isMuted;
    send({muted: isMuted})
  })

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

    if ((songInfo.elapsedSeconds ?? 0) % 5 == 0) {
      send({ position: songInfo.elapsedSeconds });
    }

    lastSongInfo = { ...songInfo };
  });

  websocket = new WebSocket.Server({
    host: config.hostname,
    port: config.port,
  });

  type Message =
    | {
        type: 'ACTION';
        action: 'play' | 'pause' | 'next' | 'previous' | 'shuffle' | 'mute';
      }
    | { type: 'ACTION'; action: 'repeat'; data: RepeatMode }
    | { type: 'ACTION'; action: 'seek'; data: number }
    | { type: 'ACTION'; action: 'getVolume' }
    | { type: 'ACTION'; action: 'setVolume'; data: number };

  websocket.on('connection', (ws: WebSocket) => {
    ws.send(createPlayerState(lastSongInfo, volume, repeat, muted));
    sockets.add(ws);

    ws.on('message', (data: string) => {
      const message = JSON.parse(data.toString()) as Message;

      console.log('Received message:', message);

      switch (message.type) {
        case 'ACTION':
          switch (message.action) {
            case 'play':
              window.webContents.send("api-websocket:play")
              // controller.play();
              break;
            case 'pause':
              // controller.pause();
              window.webContents.send("api-websocket:pause")
              break;
            case 'next':
              controller.next();
              break;
            case 'previous':
              controller.previous();
              break;
            case 'shuffle':
              controller.shuffle();
              break;
            case 'mute':
              controller.muteUnmute();
              break;
            case 'repeat':
              setLoopStatus(message.data)
              break;
            case 'seek':
              if (message.data > 0) {
                controller.goForward(Math.abs(message.data));
              } else {
                controller.goBack(Math.abs(message.data));
              }
              break;
            case 'setVolume':
              controller.setVolume(message.data);
              break;
          }
          break;
      }
      ws.send(createPlayerState(lastSongInfo, volume, repeat, muted));
    });

    ws.on('close', () => {
      sockets.delete(ws);
    });
  });
};

export const unregister = () => {
  websocket?.close();
};
