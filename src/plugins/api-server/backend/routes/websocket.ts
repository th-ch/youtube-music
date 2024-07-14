import { WebSocket, WebSocketServer } from "ws"
import { BackendContext} from "@/types/contexts"
import { APIServerConfig } from "../../config"
import registerCallback, { SongInfo } from "@/providers/song-info"
import getSongControls from '@/providers/song-controls';
import { ipcMain } from "electron"
import { RepeatMode } from "@/types/datahost-get-state";

let websocket: WebSocketServer | null = null

let volume: number = 0;
let repeat: RepeatMode = 'NONE' as RepeatMode;

const nextRepeat = ((repeat: RepeatMode) => {
  switch (repeat) {
    case 'NONE':
      return 'ALL' as const
      case 'ALL':
        return 'ONE' as const
    case 'ONE':
      return 'NONE' as const
  }
})

function createPlayerState(songInfo: SongInfo|null, volume: number, repeat: RepeatMode) {
  return JSON.stringify({
      type: "PLAYER_STATE",
      song: songInfo,
      isPlaying: songInfo? !songInfo.isPaused :false,
      position:songInfo?.elapsedSeconds??0,
      volume,
      repeat
    })
}


export const register = async ({ window, getConfig }: BackendContext<APIServerConfig>) => {
  const config = await getConfig();
  if (!config.websocket) return;
  volume = config.volume;

  const controller = getSongControls(window);

  ipcMain.on('ytmd:volume-changed', (_, newVolume) => {
    volume = newVolume;
    sockets.forEach(socket=>socket.send(createPlayerState(lastsongInfo, volume, repeat)))
  });

  ipcMain.on('ytmd:repeat-changed', (_, mode)=> {
    repeat = mode;
    sockets.forEach(socket=>socket.send(createPlayerState(lastsongInfo, volume, repeat)))
  })

  websocket = new WebSocket.Server({
    port: config.websocketPort
  })

  let lastsongInfo: SongInfo | null = null;

  registerCallback((songInfo) => {
    console.log("songInfo", songInfo, lastsongInfo)

    for (const socket of sockets) {
      socket.send(createPlayerState(songInfo, volume, repeat))
    }

    lastsongInfo = { ...songInfo }
  })

  type Message = { type: "ACTION", action: "play" | "pause" | "next" | "previous" | "shuffle" | "repeat" }
    | { type: "ACTION", action: "seek", data: number }
    | { type: "ACTION", action: "getVolume" }
    | { type: "ACTION", action: "setVolume", data: number }


  const sockets = new Set<WebSocket>();
  websocket.on("connection", (ws: WebSocket) => {
    ws.send(createPlayerState(lastsongInfo, volume, repeat))
    sockets.add(ws);

    ws.on("message", (data) => {

      const message = JSON.parse(data.toString()) as Message

      console.log("message", message)
      switch (message.type) {
        case "ACTION":
          switch (message.action) {
            case "play":
              controller.play()
              break;
            case "pause":
              controller.pause()
              break;
            case "next":
              controller.next()
              break;
            case "previous":
              controller.previous()
              break;
            case "shuffle":
              controller.shuffle()
              break;
            case "repeat":
              controller.switchRepeat()
              repeat = nextRepeat(repeat)
              break;
            case "seek":
              if (message.data > 0) {
                controller.goForward(Math.abs(message.data))
              } else {
                controller.goBack(Math.abs(message.data))
              }
              break;
            case "setVolume":
              controller.setVolume(message.data)
              break;
          }
          break;
      }

      ws.send(createPlayerState(lastsongInfo, volume, repeat))
    })

    ws.on("close", () => {
      sockets.delete(ws);
    })
  });

}

export const unregister = () => {
  websocket?.close()
}
