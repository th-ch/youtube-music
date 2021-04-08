const { notificationImage, icons } = require("./utils");
const getSongControls = require('../../providers/song-controls');
const notifier = require("node-notifier");

//store song controls reference on launch
let controls;
module.exports.setupInteractive = (win) => {
    //save controls
    const { playPause, next, previous } = getSongControls(win);
    controls = { playPause, next, previous };
}

//delete old notification
let toDelete;
function Delete() {
    if (toDelete !== undefined) {
        const removeNotif = Object.assign(toDelete, {
            remove: toDelete.id
        })
        notifier.notify(removeNotif)

        toDelete = undefined;
    }
}

//New notification
module.exports.notifyInteractive = (songInfo) => {
    Delete();
    //download image and get path
    let imgSrc = notificationImage(songInfo, true);
    toDelete = {
        //app id undefined - will break buttons
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
                //buttons
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
                    return;
                //Native datatype
                case "dismissed":
                case "timeout":
                    Delete();
            }
        }

    );
}
