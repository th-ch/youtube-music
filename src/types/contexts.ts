import type { BrowserWindow } from 'electron';
import type { PluginConfig } from '@/types/plugins';

export interface BaseContext {
  getConfig(): PluginConfig;
  setConfig(conf: Omit<PluginConfig, 'enabled'>): void;
}

export interface BackendContext extends BaseContext {
  ipc: {
    send: (event: string, ...args: unknown[]) => void;
    handle: (event: string, listener: CallableFunction) => void;
    on: (event: string, listener: CallableFunction) => void;
  };

  window: BrowserWindow;
}

export interface MenuContext extends BaseContext {
  window: BrowserWindow;
  refresh: () => Promise<void> | void;
}

export interface PreloadContext extends BaseContext {}

export interface RendererContext extends BaseContext {
  ipc: {
    send: (event: string, ...args: unknown[]) => void;
    invoke: (event: string, ...args: unknown[]) => Promise<unknown>;
    on: (event: string, listener: CallableFunction) => void;
  };
}
