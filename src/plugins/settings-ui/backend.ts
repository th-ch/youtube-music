import Plugins from '@/config/plugins';
import { createBackend } from '@/utils';
import is from 'electron-is';
import { app } from 'electron/main';

const getVersion = () => app.getVersion();

const platform = () => {
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
};

const versions = () => process.versions;

const plugins = {
  enable: (id: string) => {
    Plugins.enable(id);
  },
  disable: (id: string) => {
    Plugins.disable(id);
  },
  isEnabled: (id: string) => {
    return Plugins.isEnabled(id);
  },
};

export const backend = createBackend({
  start(ctx) {
    ctx.ipc.handle('ytmd-sui:app-version', getVersion);
    ctx.ipc.handle('ytmd-sui:platform', platform);
    ctx.ipc.handle('ytmd-sui:versions', versions);

    ctx.ipc.handle('ytmd-sui:plugins-enable', plugins.enable);
    ctx.ipc.handle('ytmd-sui:plugins-disable', plugins.disable);
    ctx.ipc.handle('ytmd-sui:plugins-isEnabled', plugins.isEnabled);
  },

  stop(ctx) {
    ctx.ipc.removeHandler('ytmd-sui:app-version');
    ctx.ipc.removeHandler('ytmd-sui:platform');
    ctx.ipc.removeHandler('ytmd-sui:versions');
    ctx.ipc.removeHandler('ytmd-sui:plugins-enable');
    ctx.ipc.removeHandler('ytmd-sui:plugins-disable');
    ctx.ipc.removeHandler('ytmd-sui:plugins-isEnabled');
  },
});
