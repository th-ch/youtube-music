import { ipcRenderer } from 'electron';

export const setupSongControls = () => {
  document.addEventListener('apiLoaded', (event) => {
    ipcRenderer.on('seekTo', (_, t: number) => event.detail.seekTo(t));
    ipcRenderer.on('seekBy', (_, t: number) => event.detail.seekBy(t));
  }, { once: true, passive: true });
};
