import { createBackend } from '@/utils';
import is from 'electron-is';
import { app } from 'electron/main';

export const backend = createBackend({
  start(ctx) {
    ctx.ipc.handle('ytmd-sui:app-version', () => app.getVersion());

    ctx.ipc.handle('ytmd-sui:platform', () => {
      const { arch } = process;

      if (is.windows()) return `Windows (${arch})`;
      if (is.macOS()) return `macOS (${arch})`;
      if (is.linux()) {
        const desktop =
          process.env.XDG_CURRENT_DESKTOP || process.env.XDG_SESSION_DESKTOP;
        const type = process.env.XDG_SESSION_TYPE;

        return `Linux (desktop=${desktop}; type=${type}; arch=${arch})`;
      }
      return process.platform + ` (${arch})`;
    });

    ctx.ipc.handle('ytmd-sui:versions', () => process.versions);
  },
});
