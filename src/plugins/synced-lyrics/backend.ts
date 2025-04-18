import { createBackend } from '@/utils';
import { net } from 'electron';

const handlers = {
  async fetch(url: string, init: RequestInit): Promise<[number, string]> {
    const res = await net.fetch(url, init);
    return [res.status, await res.text()];
  },
};

export const backend = createBackend({
  start(ctx) {
    ctx.ipc.handle('synced-lyrics:fetch', handlers.fetch);
  },
  stop(ctx) {
    ctx.ipc.removeHandler('synced-lyrics:fetch');
  },
});
