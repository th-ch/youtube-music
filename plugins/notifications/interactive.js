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
            // https://learn.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/toast-schema
            // https://learn.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/adaptive-interactive-toasts?tabs=xml
            // https://learn.microsoft.com/en-us/uwp/api/windows.ui.notifications.toasttemplatetype
			toastXml: get_xml_custom(),
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
        `content="${kind.charAt(0).toUpperCase() + kind.slice(1)}" imageUri="file:///${path.resolve(__dirname, iconLocation, `${kind}.png`)}"`;


const get_xml = (songInfo, options, imgSrc) => `
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
</toast>`

// **************************************************** //
// PREMADE TEMPLATES FOR TESTING
// DELETE AFTER TESTING
// **************************************************** //

const get_xml_custom = () => xml_banner_centered_top;

const xml_logo_ascii = `
    <toast useButtonStyles="true">
    <audio silent="true" />
    <visual>
        <binding template="ToastGeneric">
            <image id="1" src="file:///C:/Git/test/toasters/assets/surtur_rising_cover.jpg" name="Image" placement="appLogoOverride"/>
            <text id="1">The Last Stand of Frej</text>
            <text id="2">Amon Amarth</text>
        </binding>
    </visual>

    <actions>
        <action content="ᐸ" activationType="protocol" arguments="youtubemusic://pause}"/>
        <action content="‖" activationType="protocol" arguments="youtubemusic://pause}"/>
        <action content="ᐳ" activationType="protocol" arguments="youtubemusic://pause}"/>
    </actions>
    </toast>
`;


const xml_logo_icons_notext =`
<toast useButtonStyles="true">
    <audio silent="true" />
    <visual>
        <binding template="ToastGeneric">
            <image id="1" src="file:///C:/Git/test/toasters/assets/surtur_rising_cover.jpg" name="Image" placement="appLogoOverride"/>
            <text id="1">The Last Stand of Frej</text>
            <text id="2">Amon Amarth</text>
        </binding>
    </visual>

    <actions>
        <action content=""
            imageUri="file:///C:/Git/youtube-music/assets/media-icons-black/previous.png"
            activationType="protocol" arguments="youtubemusic://pause}" />
        <action content=""
            imageUri="file:///C:/Git/youtube-music/assets/media-icons-black/pause.png"
            activationType="protocol" arguments="youtubemusic://pause}" />
        <action content=""
            imageUri="file:///C:/Git/youtube-music/assets/media-icons-black/next.png"
            activationType="protocol" arguments="youtubemusic://pause}" />
    </actions>
</toast>
`;

const buttons_icons = `
<actions>
    <action content="Previous"
        imageUri="file:///C:/Git/youtube-music/assets/media-icons-black/previous.png"
        activationType="protocol" arguments="youtubemusic://pause}" />
    <action content="Pause"
        imageUri="file:///C:/Git/youtube-music/assets/media-icons-black/pause.png"
        activationType="protocol" arguments="youtubemusic://pause}" />
    <action content="Next"
        imageUri="file:///C:/Git/youtube-music/assets/media-icons-black/next.png"
        activationType="protocol" arguments="youtubemusic://pause}" />
</actions>
`;

const xml_logo_icons = `
<toast useButtonStyles="true">
    <audio silent="true" />
    <visual>
        <binding template="ToastGeneric">
            <image id="1" src="file:///C:/Git/test/toasters/assets/surtur_rising_cover.jpg" name="Image" placement="appLogoOverride"/>
            <text id="1">The Last Stand of Frej</text>
            <text id="2">Amon Amarth</text>
        </binding>
    </visual>

    ${buttons_icons}
</toast>
`;

const xml_hero = `
<toast useButtonStyles="true">
    <audio silent="true" />
    <visual>
        <binding template="ToastGeneric">
            <image id="1" src="file:///C:/Git/test/toasters/assets/surtur_rising_banner.jpg" name="Image" placement="hero"/>
            <text id="1">The Last Stand of Frej</text>
            <text id="2">Amon Amarth</text>
        </binding>
    </visual>

    ${buttons_icons}
</toast>
`;

const xml_banner_bottom = `
<toast useButtonStyles="true">
    <audio silent="true" />
    <visual>
        <binding template="ToastGeneric">
            <image id="1" src="file:///C:/Git/test/toasters/assets/surtur_rising_banner.jpg" name="Image" />
            <text id="1">The Last Stand of Frej</text>
            <text id="2">Amon Amarth</text>
        </binding>
    </visual>

    ${buttons_icons}
</toast>
`;

const xml_banner_top_custom = `
    <toast useButtonStyles="true">
    <audio silent="true" />
    <visual>
        <binding template="ToastGeneric">
            <image id="1" src="file:///C:/Git/test/toasters/assets/surtur_rising_banner.jpg" name="Image" />
            <text>ㅤ</text>
            <group>
                <subgroup>
                    <text hint-style="body">The Last Stand of Frej</text>
                    <text hint-style="captionSubtle">Amon Amarth</text>
                </subgroup>
                <subgroup hint-textStacking="bottom">
                    <text hint-style="captionSubtle" hint-wrap="true" hint-align="right">Surtur Rising</text>
                    <text hint-style="captionSubtle" hint-wrap="true" hint-align="right">2011</text>
                </subgroup>
            </group>
        </binding>
    </visual>

    ${buttons_icons}
    </toast>
`;

const xml_banner_centered_bottom = `
<toast useButtonStyles="true">
    <audio silent="true" />
    <visual>
        <binding template="ToastGeneric">
            <text>ㅤ</text>
            <group>
                <subgroup hint-weight="1" hint-textStacking="center">
                    <text hint-align="center" hint-style="subHeader">The Last Stand of Frej</text>
                    <text hint-align="center" hint-style="SubtitleSubtle">Amon Amarth</text>
                </subgroup>
            </group>
            <image id="1" src="file:///C:/Git/test/toasters/assets/surtur_rising_banner.jpg" name="Image"  hint-removeMargin="true" />
        </binding>
    </visual>

    ${buttons_icons}
</toast>
`;

const xml_banner_centered_top = `
<toast useButtonStyles="true">
    <audio silent="true" />
    <visual>
        <binding template="ToastGeneric">
            <image id="1" src="file:///C:/Git/test/toasters/assets/surtur_rising_banner.jpg" name="Image" />
            <text>ㅤ</text>
            <group>
                <subgroup hint-weight="1" hint-textStacking="center">
                    <text hint-align="center" hint-style="subHeader">The Last Stand of Frej</text>
                    <text hint-align="center" hint-style="SubtitleSubtle">Amon Amarth</text>
                </subgroup>
            </group>
        </binding>
    </visual>

    ${buttons_icons}
</toast>
`;
