import { net } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SlackApiClient, SlackApiResponse } from './slack-api-client';
import FormData from 'form-data';
import { createBackend } from '@/utils';
import registerCallback, { SongInfoEvent } from '@/providers/song-info';
import { t } from '@/i18n';

// Import SongInfo type from provider instead of defining our own
import type { SongInfo } from '@/providers/song-info';

// Plugin config type
export interface SlackNowPlayingConfig {
  enabled: boolean;
  token: string;
  cookieToken: string;
  emojiName: string;
  alternativeTitles?: boolean;
}

/**
 * Type guard to check if an object is a valid SlackNowPlayingConfig
 * @param config The object to check
 * @returns True if the object is a valid SlackNowPlayingConfig
 */
function isSlackNowPlayingConfig(config: unknown): config is SlackNowPlayingConfig {
  if (!config || typeof config !== 'object') return false;

  const c = config as Partial<SlackNowPlayingConfig>;
  return typeof c.enabled === 'boolean' &&
         typeof c.token === 'string' &&
         typeof c.cookieToken === 'string' &&
         typeof c.emojiName === 'string';
}

const defaultEmojis = [':cd:', ':headphones:', ':musical_note:', ':notes:', ':radio:'];

const state = {
  lastStatus: '',
  lastEmoji: '',
  window: undefined as Electron.BrowserWindow | undefined,
};

function validateConfig(config: SlackNowPlayingConfig): asserts config is SlackNowPlayingConfig {
  if (!config.token || !config.cookieToken || !config.emojiName) {
    throw new Error('Missing Slack config values');
  }
}

async function setNowPlaying(songInfo: SongInfo, config: SlackNowPlayingConfig) {
  try {
    validateConfig(config);

    // Skip if song is paused
    if (songInfo.isPaused) {
      return;
    }

    const title = songInfo.alternativeTitle ?? songInfo.title;
    const artistPart = songInfo.artist || 'Unknown Artist';
    const truncatedArtist = artistPart.length > 50 ? artistPart.substring(0, 50) + '...' : artistPart;

    // Use localized version of the status text
    let statusText = t('plugins.slack-now-playing.status-text')
      .replace('{{artist}}', truncatedArtist)
      .replace('{{title}}', title);

    // Ensure the status text doesn't exceed Slack's limit
    if (statusText.length > 97) statusText = statusText.substring(0, 97) + '...';

    // Calculate expiration time (current time + remaining song duration)
    const elapsed = songInfo.elapsedSeconds ?? 0;
    const remaining = Math.max(0, Math.floor(songInfo.songDuration - elapsed));
    const expirationTime = Math.floor(Date.now() / 1000) + remaining;

    await updateSlackStatusWithEmoji(statusText, expirationTime, songInfo, config);
  } catch (error) {
    console.error(`Error setting Slack status: ${error}`);
  }
}

async function updateSlackStatusWithEmoji(
  statusText: string,
  expirationTime: number,
  songInfo: SongInfo,
  config: SlackNowPlayingConfig,
) {
  try {
    validateConfig(config);
    const client = new SlackApiClient(config.token, config.cookieToken);

    const statusEmoji = await getStatusEmoji(songInfo, config);

    const profileData = {
      status_text: statusText,
      status_emoji: statusEmoji,
      status_expiration: expirationTime,
    };

    const postData = {
      token: config.token,
      profile: JSON.stringify(profileData),
    };

    const res = await client.post('users.profile.set', postData);
    const json = res.data as SlackApiResponse;

    if (!json.ok) {
      console.error(`Slack API error: ${json.error}`);
    } else {
      state.lastStatus = statusText;
      state.lastEmoji = statusEmoji;
    }
  } catch (error) {
    console.error(`Error updating Slack status: ${error}`);
  }
}

async function getStatusEmoji(songInfo: SongInfo, config: SlackNowPlayingConfig): Promise<string> {
  if (songInfo.imageSrc && await uploadEmojiToSlack(songInfo, config)) {
    return `:${config.emojiName}:`;
  }

  const randomIndex = Math.floor(Math.random() * defaultEmojis.length);
  return defaultEmojis[randomIndex];
}

async function uploadEmojiToSlack(songInfo: SongInfo, config: SlackNowPlayingConfig): Promise<boolean> {
  validateConfig(config);
  const client = new SlackApiClient(config.token, config.cookieToken);
  const filePath = await saveAlbumArtToFile(songInfo);
  if (!filePath) return false;
  const emojiDeleted = await ensureEmojiDoesNotExist(config);
  if (!emojiDeleted) return false;
  const formData = new FormData();
  formData.append('token', config.token);
  formData.append('mode', 'data');
  formData.append('name', config.emojiName);
  const fileBuffer = fs.readFileSync(filePath);
  formData.append('image', fileBuffer, {
    filename: 'album-art.jpg',
    contentType: 'image/jpeg',
  });
  const res = await client.post('emoji.add', formData, true);
  const json = res.data as SlackApiResponse;
  if (json.ok) return true;
  console.error(`Error uploading emoji: ${json.error}`);
  return false;
}

async function saveAlbumArtToFile(songInfo: SongInfo): Promise<string | null> {
  if (!songInfo.imageSrc) return null;
  try {
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, 'album-art.jpg');
    const response = await net.fetch(songInfo.imageSrc);
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, imageBuffer);
    return filePath;
  } catch (error) {
    console.error(`Error saving album art to file: ${error}`);
    return null;
  }
}

async function ensureEmojiDoesNotExist(config: SlackNowPlayingConfig): Promise<boolean> {
  validateConfig(config);
  const client = new SlackApiClient(config.token, config.cookieToken);
  const res = await client.get('emoji.list', { token: config.token });
  const json = res.data as SlackApiResponse;
  if (json.ok) {
    if (json.emoji && json.emoji[config.emojiName]) {
      return await deleteExistingEmoji(config);
    } else {
      return true;
    }
  } else {
    console.error(`Error checking emoji list: ${json.error}`);
    return false;
  }
}

async function deleteExistingEmoji(config: SlackNowPlayingConfig): Promise<boolean> {
  validateConfig(config);
  const client = new SlackApiClient(config.token, config.cookieToken);
  const data = { token: config.token, name: config.emojiName };
  const res = await client.post('emoji.remove', data);
  const json = res.data as SlackApiResponse;
  if (json.ok || json.error === 'emoji_not_found') return true;
  console.error(`Error deleting emoji: ${json.error}`);
  return false;
}

export const backend = createBackend({
  async start(ctx) {
    state.window = ctx.window;

    // Get the config
    const config = await ctx.getConfig();

    // Register callback to listen for song changes
    registerCallback((songInfo, event) => {
      // Skip time change events
      if (event === SongInfoEvent.TimeChanged) return;

      // Only update if plugin is enabled
      if (!config.enabled) {
        return;
      }

      // Update Slack status with current song
      try {
        // Check if config has the expected structure using our type guard
        if (!isSlackNowPlayingConfig(config)) {
          return;
        }

        // Make sure the config has the required properties
        if (!config.token || !config.cookieToken || !config.emojiName) {
          return;
        }

        setNowPlaying(songInfo, config)
          .catch(error => console.error(`Error in Slack Now Playing: ${error}`));
      } catch (error) {
        console.error(`Error processing song info: ${error}`);
      }
    });
  },

  async stop() {
    state.window = undefined;
    // Note: We don't unregister the callback as there's no API for that
    // It will be garbage collected when the plugin is unloaded
  },

  async onConfigChange() {
    // Config changes will be picked up on the next song change
  },
});
