import { globalShortcut } from 'electron';

import builder from '.';

export default builder.createMain(({ getConfig, send }) => {
  return {
    async onLoad() {
      const config = await getConfig();

      if (config.globalShortcuts?.volumeUp) {
        globalShortcut.register(config.globalShortcuts.volumeUp, () => send('changeVolume', true));
      }
    
      if (config.globalShortcuts?.volumeDown) {
        globalShortcut.register(config.globalShortcuts.volumeDown, () => send('changeVolume', false));
      }
    },
  };
});
