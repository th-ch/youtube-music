import type { IpcMain, IpcRenderer, BrowserWindow } from 'electron';
import type { PluginConfig } from '@/types/plugins';

export interface BackendContext {
  getConfig(): PluginConfig;
  setConfig(conf: Omit<PluginConfig, 'enabled'>): void;

  ipc: {
    handle: (event: string, listener: CallableFunction) => void;
    on: (event: string, listener: CallableFunction) => void;
  };

  win: BrowserWindow;
  electron: typeof import('electron');
}

export interface MenuContext {
  getConfig(): PluginConfig;
  setConfig(conf: Omit<PluginConfig, 'enabled'>): void;

  window: BrowserWindow;
  refresh: () => Promise<void> | void;
}

export interface PreloadContext {
  getConfig(): PluginConfig;
  setConfig(conf: Omit<PluginConfig, 'enabled'>): void;
}

export interface RendererContext {
  getConfig(): PluginConfig;
  setConfig(conf: Omit<PluginConfig, 'enabled'>): void;
}
