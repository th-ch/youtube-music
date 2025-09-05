import crypto from 'node:crypto';

import { BrowserWindow, dialog, net } from 'electron';

import { ScrobblerBase } from './base';

import { t } from '@/i18n';

import type { ScrobblerPluginConfig } from '../index';
import type { SetConfType } from '../main';
import type { SongInfo } from '@/providers/song-info';

interface LastFmData {
  method: string;
  timestamp?: number;
}

interface LastFmSongData {
  track?: string;
  duration?: number;
  artist?: string;
  album?: string;
  api_key: string;
  sk?: string;
  format: string;
  method: string;
  timestamp?: number;
  api_sig?: string;
}

/**
 * Returns the primary artist for scrobbling from the YouTube Music byline.
 * Rules:
 * - Remove trailing "- Topic"
 * - Trim anything after feat/ft/featuring/with (keeps pre-feat part intact)
 * - If no commas and exactly one connector (&/and/x/+/×), keep duo as-is (e.g., "Chuuwee & Trizz")
 * - If multiple connectors and no commas (e.g., "A & B & C"), take first artist
 * - If multiple commas (e.g., "A, B, & C"), take first artist
 * - If exactly one comma and no connectors, preserve (e.g., "Tyler, The Creator")
 */
const getPrimaryArtist = (songInfo: SongInfo): string => {
  const original = (songInfo.artist ?? '').trim();
  if (!original) return original;

  // Drop YT “- Topic” suffix
  let working = original.replace(/\s+-\s+Topic$/i, '').trim();

  // Split off features
  const featMatch = working.match(/\s+(?:feat\.?|featuring|ft\.?|with)\s+/i);
  if (featMatch && featMatch.index !== undefined) {
    working = working.slice(0, featMatch.index).trim();
  }

  const commaCount = (working.match(/,/g) ?? []).length;
  const connectorRegexGlobal = /\s+(?:&|and|[x×+])\s+/gi;
  const connectorRegex = /\s+(?:&|and|[x×+])\s+/i;
  const connectorMatches = working.match(connectorRegexGlobal) ?? [];
  const connectorCount = connectorMatches.length;

  if (commaCount === 0) {
    if (connectorCount === 1) {
      // Duo case like "Chuuwee & Trizz" -> keep as-is
      return working;
    }
    if (connectorCount >= 2) {
      // Multi-connector list without commas -> "A & B & C" => "A"
      return working.split(connectorRegex)[0].trim();
    }
    // No connectors, no commas -> single artist
    return working;
  }

  // Has commas
  if (commaCount >= 2) {
    // Typical multi-artist list -> "A, B, ..." => "A"
    return working.split(',')[0].trim();
  }

  // Exactly one comma
  if (connectorCount >= 1) {
    // Mixed comma + connector pattern like "A, B & C" -> "A"
    return working.split(',')[0].trim();
  }

  // Likely a single-comma artist name (e.g., "Tyler, The Creator") -> keep as-is
  return working;
};

export class LastFmScrobbler extends ScrobblerBase {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    super();

    this.mainWindow = mainWindow;
  }

  override isSessionCreated(config: ScrobblerPluginConfig): boolean {
    return !!config.scrobblers.lastfm.sessionKey;
  }

  override async createSession(
    config: ScrobblerPluginConfig,
    setConfig: SetConfType,
  ): Promise<ScrobblerPluginConfig> {
    // Get and store the session key
    const data = {
      api_key: config.scrobblers.lastfm.apiKey,
      format: 'json',
      method: 'auth.getsession',
      token: config.scrobblers.lastfm.token,
    };
    const apiSignature = createApiSig(data, config.scrobblers.lastfm.secret);
    const response = await net.fetch(
      `${config.scrobblers.lastfm.apiRoot}${createQueryString(data, apiSignature)}`,
    );
    const json = (await response.json()) as {
      error?: string;
      session?: {
        key: string;
      };
    };
    if (json.error) {
      config.scrobblers.lastfm.token = await createToken(config);
      // If is successful, we need retry the request
      authenticate(config, this.mainWindow).then((it) => {
        if (it) {
          this.createSession(config, setConfig);
        } else {
          // failed
          setConfig(config);
        }
      });
    }
    if (json.session) {
      config.scrobblers.lastfm.sessionKey = json.session.key;
    }
    setConfig(config);
    return config;
  }

  override setNowPlaying(
    songInfo: SongInfo,
    config: ScrobblerPluginConfig,
    setConfig: SetConfType,
  ): void {
    if (!config.scrobblers.lastfm.sessionKey) {
      return;
    }

    // This sets the now playing status in last.fm
    const data = {
      method: 'track.updateNowPlaying',
    };
    this.postSongDataToAPI(songInfo, config, data, setConfig);
  }

  override addScrobble(
    songInfo: SongInfo,
    config: ScrobblerPluginConfig,
    setConfig: SetConfType,
  ): void {
    if (!config.scrobblers.lastfm.sessionKey) {
      return;
    }

    // This adds one scrobbled song to last.fm
    const data = {
      method: 'track.scrobble',
      timestamp: Math.trunc(
        (Date.now() - (songInfo.elapsedSeconds ?? 0)) / 1000,
      ),
    };
    this.postSongDataToAPI(songInfo, config, data, setConfig);
  }

  private async postSongDataToAPI(
    songInfo: SongInfo,
    config: ScrobblerPluginConfig,
    data: LastFmData,
    setConfig: SetConfType,
  ): Promise<void> {
    // This sends a post request to the api, and adds the common data
    if (!config.scrobblers.lastfm.sessionKey) {
      await this.createSession(config, setConfig);
    }

    const title =
      config.alternativeTitles && songInfo.alternativeTitle !== undefined
        ? songInfo.alternativeTitle
        : songInfo.title;

    const postData: LastFmSongData = {
      track: title,
      duration: songInfo.songDuration,
      artist: getPrimaryArtist(songInfo),
      ...(songInfo.album ? { album: songInfo.album } : undefined), // Will be undefined if current song is a video
      api_key: config.scrobblers.lastfm.apiKey,
      sk: config.scrobblers.lastfm.sessionKey,
      format: 'json',
      ...data,
    };

    postData.api_sig = createApiSig(postData, config.scrobblers.lastfm.secret);
    const formData = createFormData(postData);
    net
      .fetch('https://ws.audioscrobbler.com/2.0/', {
        method: 'POST',
        body: formData,
      })
      .catch(
        async (error: {
          response?: {
            data?: {
              error: number;
            };
          };
        }) => {
          if (error?.response?.data?.error === 9) {
            // Session key is invalid, so remove it from the config and reauthenticate
            config.scrobblers.lastfm.sessionKey = undefined;
            config.scrobblers.lastfm.token = await createToken(config);
            authenticate(config, this.mainWindow).then((it) => {
              if (it) {
                this.createSession(config, setConfig);
              } else {
                // failed
                setConfig(config);
              }
            });
          } else {
            console.error(error);
          }
        },
      );
  }
}

const createFormData = (parameters: LastFmSongData) => {
  // Creates the body for in the post request
  const formData = new URLSearchParams();
  for (const key in parameters) {
    formData.append(key, String(parameters[key as keyof LastFmSongData]));
  }

  return formData;
};

const createQueryString = (
  parameters: Record<string, unknown>,
  apiSignature: string,
) => {
  // Creates a querystring
  const queryData: string[] = [];
  for (const key in parameters) {
    queryData.push(`${key}=${encodeURIComponent(String(parameters[key]))}`);
  }
  queryData.push(`api_sig=${apiSignature}`);
  return `?${queryData.join('&')}`;
};

const createApiSig = (
  parameters: Record<string, unknown>,
  secret: string,
): string => {
  // Creates the api signature
  // The api signature is a concatenation of the keys in alphabetical order, and the values
  // with the secret added to the end, and then hashed with MD5
  const sortedKeys = Object.keys(parameters).sort();
  let signature = '';
  for (const key of sortedKeys) {
    signature += key + parameters[key];
  }
  signature += secret;

  return crypto.createHash('md5').update(signature).digest('hex');
};

const createToken = async (config: ScrobblerPluginConfig) => {
  const { apiKey, secret, apiRoot } = config.scrobblers.lastfm;
  const data: {
    method: string;
    api_key: string;
    format: string;
  } = {
    method: 'auth.gettoken',
    api_key: apiKey,
    format: 'json',
  };
  const apiSigature = createApiSig(data, secret);
  const response = await net.fetch(
    `${apiRoot}${createQueryString(data, apiSigature)}`,
  );
  const json = (await response.json()) as Record<string, string>;
  return json?.token;
};

let authWindowOpened = false;
let latestAuthResult = false;

const authenticate = async (
  config: ScrobblerPluginConfig,
  mainWindow: BrowserWindow,
) => {
  return new Promise<boolean>((resolve) => {
    if (!authWindowOpened) {
      authWindowOpened = true;
      const url = `https://www.last.fm/api/auth/?api_key=${config.scrobblers.lastfm.apiKey}&token=${config.scrobblers.lastfm.token}`;
      const browserWindow = new BrowserWindow({
        width: 500,
        height: 600,
        show: false,
        webPreferences: {
          nodeIntegration: false,
        },
        autoHideMenuBar: true,
        parent: mainWindow,
        minimizable: false,
        maximizable: false,
        paintWhenInitiallyHidden: true,
        modal: true,
        center: true,
      });
      browserWindow.loadURL(url).then(() => {
        browserWindow.show();
        browserWindow.webContents.on('did-navigate', async (_, newUrl) => {
          const url = new URL(newUrl);
          if (url.hostname.endsWith('last.fm')) {
            if (url.pathname === '/api/auth') {
              const isApproveScreen =
                (await browserWindow.webContents.executeJavaScript(
                  "!!document.getElementsByName('confirm').length",
                )) as boolean;
              // successful authentication
              if (!isApproveScreen) {
                resolve(true);
                latestAuthResult = true;
                browserWindow.close();
              }
            } else if (url.pathname === '/api/None') {
              resolve(false);
              latestAuthResult = false;
              browserWindow.close();
            }
          }
        });
        browserWindow.on('closed', () => {
          if (!latestAuthResult) {
            dialog.showMessageBox({
              title: t('plugins.scrobbler.dialog.lastfm.auth-failed.title'),
              message: t('plugins.scrobbler.dialog.lastfm.auth-failed.message'),
              type: 'error',
            });
          }
          authWindowOpened = false;
        });
      });
    } else {
      // wait for the previous window to close
      while (authWindowOpened) {
        // wait
      }
      resolve(latestAuthResult);
    }
  });
};
