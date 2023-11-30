import { createPlugin } from '@/utils';
import { onPlayerApiReady, onUnload } from './renderer';

export default createPlugin({
  name: 'Playback Speed',
  description:
    'Listen fast, listen slow! Adds a slider that controls song speed',
  restartNeeded: false,
  config: {
    enabled: false,
  },
  renderer: {
    stop: onUnload,
    onPlayerApiReady,
  },
});
