const { notificationImage, icons, save_temp_icons } = require("./utils");
const getSongControls = require('../../providers/song-controls');
const registerCallback = require("../../providers/song-info");
const { changeProtocolHandler } = require("../../providers/protocol-handler");

const { Notification, app } = require("electron");
const path = require('path');

let songControls;
let config;
let savedNotification;

module.exports = (win, _config) => {
    songControls = getSongControls(win);
    config = _config;
    if (app.isPackaged && !config.smallInteractive) save_temp_icons();

    let lastSongInfo = { url: undefined };

    // Register songInfoCallback
    registerCallback(songInfo => {
        if (!songInfo.isPaused && (songInfo.url !== lastSongInfo.url || config.unpauseNotification)) {
            lastSongInfo = { ...songInfo };
            sendXML(songInfo);
        }
    });

    //TODO on app before close, close notification
    app.once("before-quit", () => {
        savedNotification?.close();
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
                            <text id="2">${songInfo.artist}</text>
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

const iconLocation = app.isPackaged ?
    path.resolve(app.getPath("userData"), 'icons') :
    path.resolve(__dirname, '..', '..', 'assets/media-icons-black');


const getButton = (kind) => 
    `<action ${display(kind)} activationType="protocol" arguments="youtubemusic://${kind}"/>`;

const display = (kind) => 
    config.smallInteractive ?
        `content="${icons[kind]}"` :
        `content="" imageUri="file:///${path.resolve(__dirname, iconLocation, `${kind}.png`)}"`;


// TODO MAKE DIFFERENT TEMPLATES
const xml = (songInfo, options) => {
    const xml = `
        <toast displayTimestamp="2018-01-05T13:35:00Z">
        <visual>
            <binding template="ToastGeneric">
            <text id="1">Header Text</text>
            <text id="2">Body Text</text>
            <text id="3">Body 2 Text</text>
            <text placement="attribution">Attribution Text</text>
            <image src="file:///C:/Users/John.Doe/AppData/Local/Temp/tmpBC2C.tmp4e9214ef-f478-4cea-972a-3fdd6c3acac0.png" placement="appLogoOverride" hint-crop="circle" />
            <image src="file:///C:/Users/John.Doe/AppData/Local/Temp/tmpBC2D.tmpeb4a5986-fd2a-4d7d-a69d-a78f0061d754.png" placement="hero" />
            <image src="file:///C:/Users/John.Doe/AppData/Local/Temp/tmpBC1B.tmp43598461-7e59-4600-a95c-88edbc57b2ec.png" />
            </binding>
        </visual>
        </toast>
    `;
}
