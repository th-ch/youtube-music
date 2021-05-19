const { ipcRenderer } = require('electron');

const sendVolume = (volume) => ipcRenderer.send('volume-change', volume);
const sendTime = (seconds) => ipcRenderer.send('seeked-to', seconds);

module.exports = function checkVideoLoaded() {
    const video = document.querySelector("video");
    video ? setup(video) : setTimeout(checkVideoLoaded, 500);
}

function setup(video) {

    sendVolume(video.volume);

    video.addEventListener('volumechange', e => sendVolume(e.target.volume), {passive: true});

    video.addEventListener('seeking', e => sendTime(e.target.currentTime), {passive: true}); //or 'seeked'

    ipcRenderer.on("setPlaybackTime", (_e, seconds) => {
        const timeDiff = Math.abs(video.currentTime - seconds);

        console.log(`Actual Time difference = ${timeDiff}`);

        video.yns_pause ? video.yns_pause() : video.pause();
        video.currentTime = seconds;
        video.play();
    })
}
