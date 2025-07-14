import { createPlugin } from '@/utils';

import { defaultAPIWebsocketConfig } from './config';
import { onMenu } from './menu';
import { backend } from './backend';

export default createPlugin({
    name: () => 'API Websocket',
    description: () =>
      'Expose YouTube Music as an Websocket to other applications',
    restartNeeded: false,
    config: defaultAPIWebsocketConfig,
    addedVersion: '3.7.1',
    menu: onMenu,

    renderer: {
      onPlayerApiReady(api, { setConfig, ipc }) {

        setConfig({ volume: api.getVolume() });

        ipc.on("api-websocket:muted-changed", () =>
          ipc.send("api-websocket:muted-changed-to", api.isMuted())
        );

        ipc.on("api-websocket:play", ()=>{
          api.playVideo();
        })

        ipc.on("api-websocket:pause", ()=>{
          api.pauseVideo();
        })


      },
    },

    backend
  });
