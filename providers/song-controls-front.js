const { ipcRenderer } = require("electron");

module.exports.setupSongControls = () => {
    document.addEventListener('apiLoaded', e => {
        ipcRenderer.on("seekTo", (_, t) => e.detail.seekTo(t));
        ipcRenderer.on("seekBy", (_, t) => e.detail.seekBy(t));
    }, { once: true, passive: true })
};
