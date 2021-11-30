const { ElementFromFile, templatePath } = require("../utils");

const { setOptions } = require("../../config/plugins");

function $(selector) { return document.querySelector(selector); }

let options, player, video, api;

const switchButtonDiv = ElementFromFile(
    templatePath(__dirname, "button_template.html")
);

module.exports = (_options) => {
    if (_options.forceHide) return;
    options = _options;
    document.addEventListener('apiLoaded', setup, { once: true, passive: true });
}

function setup(e) {
    api = e.detail;
    player = $('ytmusic-player');
    video = $('video');

    $('ytmusic-player-page').prepend(switchButtonDiv);

    $('#song-image.ytmusic-player').style.display = "block";

    if (options.hideVideo) {
        $('.video-switch-button-checkbox').checked = false;
        changeDisplay(false);
        forcePlaybackMode();
        // fix black video
        video.style.height = "auto";
    }

    // button checked = show video
    switchButtonDiv.addEventListener('change', (e) => {
        options.hideVideo = !e.target.checked;
        changeDisplay(e.target.checked);
        setOptions("video-toggle", options);
    })
  
    video.addEventListener('srcChanged', videoStarted);

    observeThumbnail();
}

function changeDisplay(showVideo) {
    player.style.margin = showVideo ? '' : 'auto 0px';
    player.setAttribute('playback-mode', showVideo ? 'OMV_PREFERRED' : 'ATV_PREFERRED');
    $('#song-video.ytmusic-player').style.display = showVideo ? 'unset' : 'none';
    if (showVideo && !video.style.top) {
        video.style.top = `${(player.clientHeight - video.clientHeight) / 2}px`;
    }
    moveVolumeHud(showVideo);
}

function videoStarted() {
    if (player.videoMode_) {
        // switch to high res thumbnail
        forceThumbnail($('#song-image img'));
        // show toggle button
        switchButtonDiv.style.display = "initial";
        // change display to video mode if video exist & video is hidden & option.hideVideo = false
        if (!options.hideVideo && $('#song-video.ytmusic-player').style.display === "none") {
            changeDisplay(true);
        } else {
            moveVolumeHud(!options.hideVideo);
        }
    } else {
        // video doesn't exist -> switch to song mode
        changeDisplay(false);
        // hide toggle button
        switchButtonDiv.style.display = "none";
    }
}

// on load, after a delay, the page overrides the playback-mode to 'OMV_PREFERRED' which causes weird aspect ratio in the image container
// this function fix the problem by overriding that override :)
function forcePlaybackMode() {
    const playbackModeObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.target.getAttribute('playback-mode') !== "ATV_PREFERRED") {
                playbackModeObserver.disconnect();
                mutation.target.setAttribute('playback-mode', "ATV_PREFERRED");
            }
        });
    });
    playbackModeObserver.observe(player, { attributeFilter: ["playback-mode"] });
}

// if precise volume plugin is enabled, move its hud to be on top of the video
function moveVolumeHud(showVideo) {
    const volumeHud = $('#volumeHud');
    if (volumeHud)
        volumeHud.style.top = showVideo ? `${(player.clientHeight - video.clientHeight) / 2}px` : 0;
}

function observeThumbnail() {
    const playbackModeObserver = new MutationObserver(mutations => {
        if (!$('#player').videoMode_) return;

        mutations.forEach(mutation => {
            if (!mutation.target.src.startsWith('data:')) return;
            forceThumbnail(mutation.target)
        });
    });
    playbackModeObserver.observe($('#song-image img'), { attributeFilter: ["src"] })
}

function forceThumbnail(img) {
    const thumbnails = $('#movie_player').getPlayerResponse()?.videoDetails?.thumbnail?.thumbnails;
    if (thumbnails && thumbnails.length > 0) {
        img.src = thumbnails[thumbnails.length - 1].url.split("?")[0];
    }
}
