const { notificationImage, icons, save_temp_icons, secondsToMinutes, ToastStyles } = require("./utils");
const getSongControls = require('../../providers/song-controls');
const registerCallback = require("../../providers/song-info");
const { changeProtocolHandler } = require("../../providers/protocol-handler");
const { setTrayOnClick, setTrayOnDoubleClick } = require("../../tray");

const { Notification, app, ipcMain } = require("electron");
const path = require('path');

const config = require("./config");

let songControls;
let savedNotification;

/** @param {Electron.BrowserWindow} win */
module.exports = (win) => {
    songControls = getSongControls(win);

    let currentSeconds = 0;
    ipcMain.on('apiLoaded', () => win.webContents.send('setupTimeChangedListener'));

    ipcMain.on('timeChanged', (_, t) => currentSeconds = t);

    if (app.isPackaged) save_temp_icons();

    let savedSongInfo;
    let lastUrl;

    // Register songInfoCallback
    registerCallback(songInfo => {
        if (!songInfo.artist && !songInfo.title) return;
        savedSongInfo = { ...songInfo };
        if (!songInfo.isPaused &&
            (songInfo.url !== lastUrl || config.get("unpauseNotification"))
        ) {
            lastUrl = songInfo.url
            sendNotification(songInfo);
        }
    });

    if (config.get("trayControls")) {
        setTrayOnClick(() => {
            if (savedNotification) {
                savedNotification.close();
                savedNotification = undefined;
            } else if (savedSongInfo) {
                sendNotification({
                    ...savedSongInfo,
                    elapsedSeconds: currentSeconds
                })
            }
        });

        setTrayOnDoubleClick(() => {
            if (win.isVisible()) {
                win.hide();
            } else win.show();
        })
    }


    app.once("before-quit", () => {
        savedNotification?.close();
    });


    changeProtocolHandler(
        (cmd) => {
            if (Object.keys(songControls).includes(cmd)) {
                songControls[cmd]();
                if (config.get("refreshOnPlayPause") && (
                    cmd === 'pause' ||
                    (cmd === 'play' && !config.get("unpauseNotification"))
                )
                ) {
                    setImmediate(() =>
                        sendNotification({
                            ...savedSongInfo,
                            isPaused: cmd === 'pause',
                            elapsedSeconds: currentSeconds
                        })
                    );
                }
            }
        }
    )
}

function sendNotification(songInfo) {
    const iconSrc = notificationImage(songInfo);

    savedNotification?.close();

    savedNotification = new Notification({
        title: songInfo.title || "Playing",
        body: songInfo.artist,
        icon: iconSrc,
        silent: true,
        // https://learn.microsoft.com/en-us/uwp/schemas/tiles/toastschema/schema-root
        // https://learn.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/toast-schema
        // https://learn.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/adaptive-interactive-toasts?tabs=xml
        // https://learn.microsoft.com/en-us/uwp/api/windows.ui.notifications.toasttemplatetype
        toastXml: get_xml(songInfo, iconSrc),
    });

    savedNotification.on("close", (_) => {
        savedNotification = undefined;
    });

    savedNotification.show();
}

const get_xml = (songInfo, iconSrc) => {
    switch (config.get("toastStyle")) {
        default:
        case ToastStyles.logo:
        case ToastStyles.legacy:
            return xml_logo(songInfo, iconSrc);
        case ToastStyles.banner_top_custom:
            return xml_banner_top_custom(songInfo, iconSrc);
        case ToastStyles.hero:
            return xml_hero(songInfo, iconSrc);
        case ToastStyles.banner_bottom:
            return xml_banner_bottom(songInfo, iconSrc);
        case ToastStyles.banner_centered_bottom:
            return xml_banner_centered_bottom(songInfo, iconSrc);
        case ToastStyles.banner_centered_top:
            return xml_banner_centered_top(songInfo, iconSrc);
    };
}

const iconLocation = app.isPackaged ?
    path.resolve(app.getPath("userData"), 'icons') :
    path.resolve(__dirname, '..', '..', 'assets/media-icons-black');

const display = (kind) => {
    if (config.get("toastStyle") === ToastStyles.legacy) {
        return `content="${icons[kind]}"`;
    } else {
        return `\
            content="${config.get("hideButtonText") ? "" : kind.charAt(0).toUpperCase() + kind.slice(1)}"\
            imageUri="file:///${path.resolve(__dirname, iconLocation, `${kind}.png`)}"
        `;
    }
}

const getButton = (kind) =>
    `<action ${display(kind)} activationType="protocol" arguments="youtubemusic://${kind}"/>`;

const getButtons = (isPaused) => `\
    <actions>
        ${getButton('previous')}
        ${isPaused ? getButton('play') : getButton('pause')}
        ${getButton('next')}
    </actions>\
`;

const toast = (content, isPaused) => `\
<toast>
    <audio silent="true" />
    <visual>
        <binding template="ToastGeneric">
            ${content}
        </binding>
    </visual>

    ${getButtons(isPaused)}
</toast>`;

const xml_image = ({ title, artist, isPaused }, imgSrc, placement) => toast(`\
            <image id="1" src="${imgSrc}" name="Image" ${placement}/>
            <text id="1">${title}</text>
            <text id="2">${artist}</text>\
`, isPaused);


const xml_logo = (songInfo, imgSrc) => xml_image(songInfo, imgSrc, 'placement="appLogoOverride"');

const xml_hero = (songInfo, imgSrc) => xml_image(songInfo, imgSrc, 'placement="hero"');

const xml_banner_bottom = (songInfo, imgSrc) => xml_image(songInfo, imgSrc, '');

const xml_banner_top_custom = (songInfo, imgSrc) => toast(`\
            <image id="1" src="${imgSrc}" name="Image" />
            <text>ㅤ</text>
            <group>
                <subgroup>
                    <text hint-style="body">${songInfo.title}</text>
                    <text hint-style="captionSubtle">${songInfo.artist}</text>
                </subgroup>
                ${xml_more_data(songInfo)}
            </group>\
`, songInfo.isPaused);

const xml_more_data = ({ album, elapsedSeconds, songDuration }) => `\
<subgroup hint-textStacking="bottom">
    ${album ?
        `<text hint-style="captionSubtle" hint-wrap="true" hint-align="right">${album}</text>` : ''}  
    <text hint-style="captionSubtle" hint-wrap="true" hint-align="right">${secondsToMinutes(elapsedSeconds)} / ${secondsToMinutes(songDuration)}</text>
</subgroup>\
`;

const xml_banner_centered_bottom = ({ title, artist, isPaused }, imgSrc) => toast(`\
            <text>ㅤ</text>
            <group>
                <subgroup hint-weight="1" hint-textStacking="center">
                    <text hint-align="center" hint-style="${titleFontPicker(title)}">${title}</text>
                    <text hint-align="center" hint-style="SubtitleSubtle">${artist}</text>
                </subgroup>
            </group>
            <image id="1" src="${imgSrc}" name="Image"  hint-removeMargin="true" />\
`, isPaused);

const xml_banner_centered_top = ({ title, artist, isPaused }, imgSrc) => toast(`\
            <image id="1" src="${imgSrc}" name="Image" />
            <text>ㅤ</text>
            <group>
                <subgroup hint-weight="1" hint-textStacking="center">
                    <text hint-align="center" hint-style="${titleFontPicker(title)}">${title}</text>
                    <text hint-align="center" hint-style="SubtitleSubtle">${artist}</text>
                </subgroup>
            </group>\
`, isPaused);

const titleFontPicker = (title) => {
    if (title.length <= 13) {
        return 'Header';
    } else if (title.length <= 22) {
        return 'Subheader';
    } else if (title.length <= 26) {
        return 'Title';
    } else {
        return 'Subtitle';
    }
}
