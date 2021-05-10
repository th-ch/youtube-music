const { notificationImage, icons } = require("./utils");
const getSongControls = require('../../providers/song-controls');
const registerCallback = require("../../providers/song-info");
const notifier = require("node-notifier");

//store song controls reference on launch
let controls;
let notificationOnPause;

module.exports = (win, unpauseNotification) => {
    //Save controls and onPause option
    const { playPause, next, previous } = getSongControls(win);
    controls = { playPause, next, previous };
    notificationOnPause = unpauseNotification;

    // Register songInfoCallback
    registerCallback(songInfo => {
		if (!songInfo.isPaused || notificationOnPause) {
            sendToaster(songInfo);
		}
	});

    win.webContents.once("closed", () => {
        deleteNotification()
    });
}

//delete old notification
let toDelete;
function deleteNotification() {
    if (toDelete !== undefined) {
        // To remove the notification it has to be done this way
        const removeNotif = Object.assign(toDelete, {
            remove: toDelete.id
        })
        notifier.notify(removeNotif)

        toDelete = undefined;
    }
}

//New notification
function sendToaster(songInfo) {
    deleteNotification();
    //download image and get path
    let imgSrc = notificationImage(songInfo, true);
    toDelete = {
        //app id undefined - will break buttons
        title: songInfo.title || "Playing",
        message: songInfo.artist,
        id: parseInt(Math.random() * 1000000, 10),
        icon: imgSrc,
        actions: [
            icons.previous,
            songInfo.isPaused ? icons.play : icons.pause,
            icons.next
        ],
        sound: false,
    };
    //send notification
    notifier.notify(
        toDelete,
        (err, data) => {
            // Will also wait until notification is closed.
            if (err) {
                console.log(`ERROR = ${err.toString()}\n DATA = ${data}`);
            }
            switch (data) {
                //buttons
                case icons.previous.normalize():
                    controls.previous();
                    return;
                case icons.next.normalize():
                    controls.next();
                    return;
                case icons.play.normalize():
                    controls.playPause();
                    // dont delete notification on play/pause
                    toDelete = undefined;
                    //manually send notification if not sending automatically
                    if (!notificationOnPause) {
                        songInfo.isPaused = false;
                        sendToaster(songInfo);
                    }
                    return;
                case icons.pause.normalize():
                    controls.playPause();
                    songInfo.isPaused = true;
                    toDelete = undefined;
                    sendToaster(songInfo);
                    return;
                //Native datatype
                case "dismissed":
                case "timeout":
                    deleteNotification();
            }
        }

    );
}
