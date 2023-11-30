import { createPlugin } from '@/utils';
import { onPlayerApiReady, onUnload } from './renderer';

export default createPlugin({
  name: 'Playback Speed',
  restartNeeded: false,
  config: {
    enabled: false,
  },
  renderer: {
    stop: onUnload,
    onPlayerApiReady,
  }
});
