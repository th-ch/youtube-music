const { notificationImage, icons } = require("./utils");
const getSongControls = require('../../providers/song-controls');
const registerCallback = require("../../providers/song-info");
const { changeProtocolHandler } = require("../../providers/protocol-handler");

const { Notification } = require("electron");
const path = require('path');

let songControls;
let config;
let savedNotification;

module.exports = (win, _config) => {
    songControls = getSongControls(win);
    config = _config;

    let lastSongInfo = { url: undefined };

    // Register songInfoCallback
    registerCallback((songInfo, cause) => {
        if (!songInfo.isPaused && (songInfo.url !== lastSongInfo.url || config.unpauseNotification)) {
            lastSongInfo = { ...songInfo };
            sendXML(songInfo);
        }
    });

    win.webContents.once("closed", () => {
        savedNotification = undefined;
    });

    changeProtocolHandler(
        (cmd) => {
            if (Object.keys(songControls).includes(cmd)) {
                songControls[cmd]();
                if (cmd === 'pause' || (cmd === 'play' && !config.unpauseNotification)) {
                    setImmediate(() => 
                        sendXML({ ...lastSongInfo, isPaused: cmd === 'pause' })
                    );
                }
            }
        }
    )
}


function sendXML(songInfo) {
    const imgSrc = notificationImage(songInfo, true);

    savedNotification?.close();

    savedNotification = new Notification({
			title: songInfo.title || "Playing",
			body: songInfo.artist,
			icon: imgSrc,
			silent: true,
            // https://learn.microsoft.com/en-us/uwp/schemas/tiles/toastschema/schema-root
            // https://learn.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/adaptive-interactive-toasts?tabs=xml
            // https://learn.microsoft.com/en-us/uwp/api/windows.ui.notifications.toasttemplatetype
			toastXml: `
                <toast useButtonStyles="true">
                    <audio silent="true" />
                    <visual>
                        <binding template="ToastImageAndText02">
                            <image id="1" src="${imgSrc}" name="Image" />
                            <text id="1">${songInfo.title}</text>
                            <text id="2">${songInfo.artist}}</text>
                        </binding>
                    </visual>

                    <actions>
                        ${getButton('previous')}
                        ${songInfo.isPaused ? getButton('play') : getButton('pause')}
                        ${getButton('next')}
                    </actions>
                </toast>`,
		});

    savedNotification.on("close", (_) => {
        savedNotification = undefined;
    });

    savedNotification.show();
}

const getButton = (kind) => 
    `<action ${display(kind)} activationType="protocol" arguments="youtubemusic://${kind}"/>`;

const display = (kind) => 
    config.smallInteractive ?
        `content="${icons[kind]}"` :
        `content="" imageUri="file:///${path.resolve(__dirname, "../../assets/media-icons-black", `${kind}.png`)}"`;
