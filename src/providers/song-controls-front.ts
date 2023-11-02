export const setupSongControls = () => {
  document.addEventListener('apiLoaded', (event) => {
    window.ipcRenderer.on('seekTo', (_, t: number) => event.detail.seekTo(t));
    window.ipcRenderer.on('seekBy', (_, t: number) => event.detail.seekBy(t));
  }, { once: true, passive: true });
};
