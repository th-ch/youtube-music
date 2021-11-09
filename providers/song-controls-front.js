const { ipcRenderer } = require("electron");

module.exports.seekTo = seekTo;
function seekTo(t) {
    document.querySelector('video').currentTime = t;
}

module.exports.seek = seek;
function seek(o) {
    document.querySelector('video').currentTime += o;
}

module.exports.setupSongControls = () => {
	ipcRenderer.on("seekTo", async (_, t) => seekTo(t));
    ipcRenderer.on("seek", async (_, t) => seek(t));
    ipcRenderer.once("registerOnSeek", registerOnSeek)
};

async function registerOnSeek() {
    const register = v => v.addEventListener('seeked', () => ipcRenderer.send('seeked', v.currentTime));
    let video =  document.querySelector('video');
    if (video) {
        register(video);
    }
    else {
        document.addEventListener('apiLoaded', () => {
            register(document.querySelector('video'))
        }, { once: true, passive: true })
    }
}
