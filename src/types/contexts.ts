import type { BrowserWindow } from 'electron';
import type { PluginConfig } from '@/types/plugins';

export interface BaseContext<Config extends PluginConfig> {
  getConfig(): Promise<Config>;
  setConfig(conf: Partial<Omit<Config, 'enabled'>>): void;
}

export interface BackendContext<Config extends PluginConfig> extends BaseContext<Config> {
  ipc: {
    send: (event: string, ...args: unknown[]) => void;
    handle: (event: string, listener: CallableFunction) => void;
    on: (event: string, listener: CallableFunction) => void;
  };

  window: BrowserWindow;
}

export interface MenuContext<Config extends PluginConfig> extends BaseContext<Config> {
  window: BrowserWindow;
  refresh: () => Promise<void> | void;
}

export interface PreloadContext<Config extends PluginConfig> extends BaseContext<Config> {}

export interface RendererContext<Config extends PluginConfig> extends BaseContext<Config> {
  ipc: {
    send: (event: string, ...args: unknown[]) => void;
    invoke: (event: string, ...args: unknown[]) => Promise<unknown>;
    on: (event: string, listener: CallableFunction) => void;
  };
}
