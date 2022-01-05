const { ipcRenderer } = require("electron");
const config = require("../config");
const is = require("electron-is");

module.exports.setupSongControls = () => {
    document.addEventListener('apiLoaded', e => {
        ipcRenderer.on("seekTo", (_, t) => e.detail.seekTo(t));
        ipcRenderer.on("seekBy", (_, t) => e.detail.seekBy(t));
        if (is.linux() && config.plugins.isEnabled('shortcuts')) { // MPRIS Enabled
            document.querySelector('video').addEventListener('seeked', v => ipcRenderer.send('seeked', v.target.currentTime));
        }
    }, { once: true, passive: true })
};
