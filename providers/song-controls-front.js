const { ipcRenderer } = require("electron");
const config = require("../config");
const is = require("electron-is");

module.exports.setupSongControls = () => {
    document.addEventListener('apiLoaded', e => {
        ipcRenderer.on("seekTo", (_, t) => e.target.seekTo(t));
        ipcRenderer.on("seekBy", (_, t) => e.target.seekBy(t));

    }, { once: true, passive: true })

    if (is.linux() && config.plugins.isEnabled('shortcuts')) { // MPRIS Enabled
        document.querySelector('video').addEventListener('seeked', () => ipcRenderer.send('seeked', v.currentTime));
    }
};
