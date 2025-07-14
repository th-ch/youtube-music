import { createBackend } from '@/utils';
import { APIWebsocketConfig } from '../config';
import { registerWebsocket, unregisterWebsocket } from './routes';

type BackendType = {
  oldConfig?: APIWebsocketConfig;
};

export const backend = createBackend<BackendType, APIWebsocketConfig>({
  async start(ctx) {
    ctx.ipc.on('ytmd:player-api-loaded', () => {
      ctx.ipc.send('ytmd:setup-seeked-listener', );
      ctx.ipc.send('ytmd:setup-time-changed-listener');
      ctx.ipc.send('ytmd:setup-repeat-changed-listener');
      ctx.ipc.send("ytmd:setup-volume-changed-listener")
      ctx.window.webContents.on("ytmd:toggle-mute", ()=> {
        ctx.ipc.send("api-websocket:muted-changed")
      })
      registerWebsocket(ctx);
    });
  },
  stop() {
    unregisterWebsocket();
  },
  onConfigChange(newConfig) {
    if (
      this.oldConfig?.hostname == newConfig.hostname &&
      this.oldConfig.port == newConfig.port
    ) {
      this.oldConfig = newConfig;
      return;
    }

    this.oldConfig = newConfig;
  },
});
