import { createBackend } from '@/utils';

export const backend = createBackend({
  start({ ipc }) {
    ipc.on('ytmd:player-api-loaded', () =>
      ipc.send('ytmd:setup-time-changed-listener'),
    );

    ipc.on('ytmd:time-changed', (t: number) => {
      ipc.send('synced-lyrics:setTime', t);
    });

    ipc.on('ytmd:play-or-paused', (data: object) => {
      ipc.send('synced-lyrics:paused', data);
    });
  },
});
