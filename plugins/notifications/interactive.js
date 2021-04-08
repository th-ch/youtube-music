const is = require("electron-is");
const { app } = require("electron");
const { notificationImage, icons } = require("./utils");
const getSongControls = require('../../providers/song-controls');
const notifier = require("node-notifier");

const appID = "com.github.th-ch.youtube-music";
const shortcutPath = `("Youtube Music" "${app.getPath("exe")}" "${appID}")`;

//saving controls here avoid errors
let controls;

//delete old notification
let toDelete;
function Delete() {
    if (toDelete === undefined) {
        return;
    }
    const removeNotif = Object.assign(toDelete, {
        remove: toDelete.id
    })
    notifier.notify(removeNotif)

    toDelete = undefined;
}

//Setup on launch
module.exports.setup = (win) => {
    //save controls
    const { playPause, next, previous } = getSongControls(win);
    controls = { playPause, next, previous };
    //setup global listeners
    notifier.on("dismissed", () => { Delete(); });
    notifier.on("timeout", () => { Delete(); });
    //try installing shortcut
    if (!is.dev()) {
        notifier.notify({
            title: "installing shortcut",
            id: 1337,
            install: shortcutPath
        });
    }

    //close all listeners on close
    win.on("closed", () => {
        notifier.removeAllListeners();
    });
}

//New notification
module.exports.notifyInteractive = function sendToaster(songInfo) {
    Delete();
    //download image and get path
    let imgSrc = notificationImage(songInfo, true);
    toDelete = {
        appID: !is.dev() ? appID : undefined, //(will break action buttons if not installed to start menu)
        title: songInfo.title || "Playing",
        message: songInfo.artist,
        id: parseInt(Math.random() * 1000000, 10),
        icon: imgSrc,
        actions: [
            icons.previous, // Previous
            songInfo.isPaused ? icons.play : icons.pause,
            icons.next // Next
        ],
        sound: false,
    };
    //send notification
    notifier.notify(
        toDelete,
        (err, data) => {
            // Will also wait until notification is closed.
            if (err) {
                console.log(`ERROR = ${err}\n DATA = ${data}`);
            }
            switch (data) {
                case icons.previous.normalize():
                    controls.previous();
                    return;
                case icons.next.normalize():
                    controls.next();
                    return;
                case icons.play.normalize():
                    controls.playPause();
                    toDelete = undefined; // dont delete notification on play/pause
                    return;
                case icons.pause.normalize():
                    controls.playPause();
                    songInfo.isPaused = true;
                    toDelete = undefined; // it gets deleted automatically
                    sendToaster(songInfo);
            }
        }

    );
}
