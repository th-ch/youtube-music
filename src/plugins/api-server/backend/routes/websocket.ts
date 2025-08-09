import { BackendContext } from "@/types/contexts";
import { HonoApp } from "../types";
import { APIServerConfig, AuthStrategy } from "../../config";
import registerCallback, { SongInfo } from "@/providers/song-info";
import { RepeatMode, VolumeState } from "@/types/datahost-get-state";
import { UpgradeWebSocket, WSContext } from "hono/ws";
import { ipcMain } from "electron";
import { JWTPayloadSchema } from "../scheme";
import { decode, jwt } from "hono/jwt";

enum DataTypes {
    PLAYER_STATE = "PLAYER_STATE"
}

type PlayerState = {
    song: SongInfo;
    isPlaying: boolean;
    muted: boolean;
    position: number;
    volume: number;
    repeat: RepeatMode;
};

let volumeState: VolumeState
let repeat: RepeatMode = "NONE" as RepeatMode

export const register = (app: HonoApp, backendCtx: BackendContext<APIServerConfig>, upgradeWebSocket: UpgradeWebSocket<WebSocket>) => {
    const sockets = new Set<WSContext<WebSocket>>()

    let lastSongInfo: SongInfo | null;

    function send(state: Partial<PlayerState>) {
        sockets.forEach((socket) => socket.send(JSON.stringify({ type: DataTypes.PLAYER_STATE, ...state })))
    }

    const createPlayerState = ({ songInfo, volume, repeat, muted }: { songInfo: SongInfo | null, volume: number, repeat: RepeatMode, muted: boolean }) => JSON.stringify({
        type: DataTypes.PLAYER_STATE,
        song: songInfo,
        isPlaying: songInfo ? !songInfo.isPaused : false,
        muted: muted ?? false,
        position: songInfo?.elapsedSeconds ?? 0,
        volume,
        repeat
    })


    registerCallback((songInfo) => {
        if (lastSongInfo?.videoId !== songInfo.videoId) {
            send({ song: songInfo, position: 0 })
        }

        if (lastSongInfo?.isPaused !== songInfo.isPaused) {
            send({
                isPlaying: !(songInfo?.isPaused ?? true),
                position: songInfo.elapsedSeconds
            })
        }

        // Only send the current position every 5 seconds
        if ((songInfo.elapsedSeconds ?? 0) % 5 === 0) {
            send({ position: songInfo.elapsedSeconds })
        }

        lastSongInfo = { ...songInfo }
    })


    ipcMain.on("ytmd:volume-changed", (_, newVolumeState: { state: number, isMuted: boolean }) => {
        volumeState = newVolumeState
        send({ volume: volumeState.state, muted: volumeState.isMuted })
    })

    ipcMain.on("ytmd:repeat-changed", (_, mode: RepeatMode) => {
        repeat = mode
        send({ repeat })
    })

    ipcMain.on("ytmd:seeked", (_, t: number) => {
        send({ position: t })
    })

    app.get("/ws", upgradeWebSocket(async (ctx) => {
        // Auth stuff to use `auth.` protocol for the jwt token
        // const protocols = ctx.req.header('Sec-WebSocket-Protocol')?.split(',').map(p => p.trim()) || []
        // const tokenProtocol = protocols.find(p => p.startsWith('auth.'))
        // const token = tokenProtocol?.substring(5) // Remove 'auth.' prefix

        // if (!token) return {}

        // const { payload } = decode(token)
        // const result = await JWTPayloadSchema.spa(payload)
        // const config = await backendCtx.getConfig()
        // const isAuthorized = config.authStrategy === AuthStrategy.NONE || (result.success && config.authorizedClients.includes(result.data.id))

        return {
            onOpen(evt, ws) {
                ws.send(createPlayerState({ songInfo: lastSongInfo, volume: volumeState.state, repeat, muted: volumeState.isMuted }))
                sockets.add(ws)
            },

            onClose(evt, ws) {
                sockets.delete(ws)

                console.log(sockets)
            }
        }
    }))
}