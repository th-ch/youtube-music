import path from 'node:path';

import { app, BrowserWindow, ipcMain, Notification } from 'electron';

import { notificationImage, secondsToMinutes, ToastStyles } from './utils';
import config from './config';

import getSongControls from '../../providers/song-controls';
import registerCallback, { SongInfo } from '../../providers/song-info';
import { changeProtocolHandler } from '../../providers/protocol-handler';
import { setTrayOnClick, setTrayOnDoubleClick } from '../../tray';
import { getMediaIconLocation, mediaIcons, saveMediaIcon } from '../utils';

let songControls: ReturnType<typeof getSongControls>;
let savedNotification: Notification | undefined;

export default (win: BrowserWindow) => {
  songControls = getSongControls(win);

  let currentSeconds = 0;
  ipcMain.on('apiLoaded', () => win.webContents.send('setupTimeChangedListener'));

  ipcMain.on('timeChanged', (_, t: number) => currentSeconds = t);

  if (app.isPackaged) {
    saveMediaIcon();
  }

  let savedSongInfo: SongInfo;
  let lastUrl: string | undefined;

  // Register songInfoCallback
  registerCallback((songInfo) => {
    if (!songInfo.artist && !songInfo.title) {
      return;
    }

    savedSongInfo = { ...songInfo };
    if (!songInfo.isPaused
      && (songInfo.url !== lastUrl || config.get('unpauseNotification'))
    ) {
      lastUrl = songInfo.url;
      sendNotification(songInfo);
    }
  });

  if (config.get('trayControls')) {
    setTrayOnClick(() => {
      if (savedNotification) {
        savedNotification.close();
        savedNotification = undefined;
      } else if (savedSongInfo) {
        sendNotification({
          ...savedSongInfo,
          elapsedSeconds: currentSeconds,
        });
      }
    });

    setTrayOnDoubleClick(() => {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
      }
    });
  }

  app.once('before-quit', () => {
    savedNotification?.close();
  });

  changeProtocolHandler(
    (cmd) => {
      if (Object.keys(songControls).includes(cmd)) {
        songControls[cmd as keyof typeof songControls]();
        if (config.get('refreshOnPlayPause') && (
          cmd === 'pause'
          || (cmd === 'play' && !config.get('unpauseNotification'))
        )
        ) {
          setImmediate(() =>
            sendNotification({
              ...savedSongInfo,
              isPaused: cmd === 'pause',
              elapsedSeconds: currentSeconds,
            }),
          );
        }
      }
    },
  );
};

function sendNotification(songInfo: SongInfo) {
  const iconSrc = notificationImage(songInfo);

  savedNotification?.close();

  let icon: string;
  if (typeof iconSrc === 'object') {
    icon = iconSrc.toDataURL();
  } else {
    icon = iconSrc;
  }

  savedNotification = new Notification({
    title: songInfo.title || 'Playing',
    body: songInfo.artist,
    icon: iconSrc,
    silent: true,
    // https://learn.microsoft.com/en-us/uwp/schemas/tiles/toastschema/schema-root
    // https://learn.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/toast-schema
    // https://learn.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/adaptive-interactive-toasts?tabs=xml
    // https://learn.microsoft.com/en-us/uwp/api/windows.ui.notifications.toasttemplatetype
    toastXml: getXml(songInfo, icon),
  });

  savedNotification.on('close', () => {
    savedNotification = undefined;
  });

  savedNotification.show();
}

const getXml = (songInfo: SongInfo, iconSrc: string) => {
  switch (config.get('toastStyle')) {
    default:
    case ToastStyles.logo:
    case ToastStyles.legacy: {
      return xmlLogo(songInfo, iconSrc);
    }

    case ToastStyles.banner_top_custom: {
      return xmlBannerTopCustom(songInfo, iconSrc);
    }

    case ToastStyles.hero: {
      return xmlHero(songInfo, iconSrc);
    }

    case ToastStyles.banner_bottom: {
      return xmlBannerBottom(songInfo, iconSrc);
    }

    case ToastStyles.banner_centered_bottom: {
      return xmlBannerCenteredBottom(songInfo, iconSrc);
    }

    case ToastStyles.banner_centered_top: {
      return xmlBannerCenteredTop(songInfo, iconSrc);
    }
  }
};
const display = (kind: keyof typeof mediaIcons) => {
  if (config.get('toastStyle') === ToastStyles.legacy) {
    return `content="${mediaIcons[kind]}"`;
  }

  return `\
            content="${config.get('hideButtonText') ? '' : kind.charAt(0).toUpperCase() + kind.slice(1)}"\
            imageUri="file:///${path.resolve(getMediaIconLocation(), `${kind}.png`)}"
        `;
};

const getButton = (kind: keyof typeof mediaIcons) =>
  `<action ${display(kind)} activationType="protocol" arguments="youtubemusic://${kind}"/>`;

const getButtons = (isPaused: boolean) => `\
    <actions>
        ${getButton('previous')}
        ${isPaused ? getButton('play') : getButton('pause')}
        ${getButton('next')}
    </actions>\
`;

const toast = (content: string, isPaused: boolean) => `\
<toast>
    <audio silent="true" />
    <visual>
        <binding template="ToastGeneric">
            ${content}
        </binding>
    </visual>

    ${getButtons(isPaused)}
</toast>`;

const xmlImage = ({ title, artist, isPaused }: SongInfo, imgSrc: string, placement: string) => toast(`\
            <image id="1" src="${imgSrc}" name="Image" ${placement}/>
            <text id="1">${title}</text>
            <text id="2">${artist}</text>\
`, isPaused ?? false);

const xmlLogo = (songInfo: SongInfo, imgSrc: string) => xmlImage(songInfo, imgSrc, 'placement="appLogoOverride"');

const xmlHero = (songInfo: SongInfo, imgSrc: string) => xmlImage(songInfo, imgSrc, 'placement="hero"');

const xmlBannerBottom = (songInfo: SongInfo, imgSrc: string) => xmlImage(songInfo, imgSrc, '');

const xmlBannerTopCustom = (songInfo: SongInfo, imgSrc: string) => toast(`\
            <image id="1" src="${imgSrc}" name="Image" />
            <text>ㅤ</text>
            <group>
                <subgroup>
                    <text hint-style="body">${songInfo.title}</text>
                    <text hint-style="captionSubtle">${songInfo.artist}</text>
                </subgroup>
                ${xmlMoreData(songInfo)}
            </group>\
`, songInfo.isPaused ?? false);

const xmlMoreData = ({ album, elapsedSeconds, songDuration }: SongInfo) => `\
<subgroup hint-textStacking="bottom">
    ${album
  ? `<text hint-style="captionSubtle" hint-wrap="true" hint-align="right">${album}</text>` : ''}
    <text hint-style="captionSubtle" hint-wrap="true" hint-align="right">${secondsToMinutes(elapsedSeconds ?? 0)} / ${secondsToMinutes(songDuration)}</text>
</subgroup>\
`;

const xmlBannerCenteredBottom = ({ title, artist, isPaused }: SongInfo, imgSrc: string) => toast(`\
            <text>ㅤ</text>
            <group>
                <subgroup hint-weight="1" hint-textStacking="center">
                    <text hint-align="center" hint-style="${titleFontPicker(title)}">${title}</text>
                    <text hint-align="center" hint-style="SubtitleSubtle">${artist}</text>
                </subgroup>
            </group>
            <image id="1" src="${imgSrc}" name="Image"  hint-removeMargin="true" />\
`, isPaused ?? false);

const xmlBannerCenteredTop = ({ title, artist, isPaused }: SongInfo, imgSrc: string) => toast(`\
            <image id="1" src="${imgSrc}" name="Image" />
            <text>ㅤ</text>
            <group>
                <subgroup hint-weight="1" hint-textStacking="center">
                    <text hint-align="center" hint-style="${titleFontPicker(title)}">${title}</text>
                    <text hint-align="center" hint-style="SubtitleSubtle">${artist}</text>
                </subgroup>
            </group>\
`, isPaused ?? false);

const titleFontPicker = (title: string) => {
  if (title.length <= 13) {
    return 'Header';
  }

  if (title.length <= 22) {
    return 'Subheader';
  }

  if (title.length <= 26) {
    return 'Title';
  }

  return 'Subtitle';
};
