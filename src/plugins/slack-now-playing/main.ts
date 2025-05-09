import { net } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SlackApiClient, SlackApiResponse } from './slack-api-client';
import FormData from 'form-data';
import { createBackend, LoggerPrefix } from '@/utils';
import registerCallback, { SongInfoEvent } from '@/providers/song-info';

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

interface SlackProfileData {
  status_text: string;
  status_emoji: string;
  status_expiration?: number;
}

interface SlackProfileUpdateData {
  token: string;
  profile: string; // JSON stringified profile data
}



export interface SlackNowPlayingConfig {
  enabled: boolean;
  token: string;
  cookieToken: string;
  emojiName: string;
}

const defaultEmojis = [':cd:', ':headphones:', ':musical_note:', ':notes:', ':radio:'];

const state = {
  lastStatus: '',
  lastEmoji: '',
  window: undefined as Electron.BrowserWindow | undefined,
};

function validateConfig(config: SlackNowPlayingConfig): asserts config is SlackNowPlayingConfig {
  console.log(LoggerPrefix, '[SlackNowPlaying] Validating config');
  if (!config.token || !config.cookieToken || !config.emojiName) {
    console.error(LoggerPrefix, '[SlackNowPlaying] Missing required config values');
    throw new Error('Missing Slack config values');
  }
  console.log(LoggerPrefix, '[SlackNowPlaying] Config validation successful');
}

async function setNowPlaying(songInfo: SongInfo, config: SlackNowPlayingConfig) {
  console.log(LoggerPrefix, '[SlackNowPlaying] Setting now playing status for:', songInfo.title);
  
  try {
    validateConfig(config);
    
    // Skip if song is paused
    if (songInfo.isPaused) {
      console.log(LoggerPrefix, '[SlackNowPlaying] Song is paused, not updating status');
      return;
    }
    
    const title = songInfo.alternativeTitle ?? songInfo.title;
    const artistPart = songInfo.artist || 'Unknown Artist';
    const truncatedArtist = artistPart.length > 50 ? artistPart.substring(0, 50) + '...' : artistPart;
    let statusText = `Now Playing: ${truncatedArtist} - ${title}`;
    if (statusText.length > 97) statusText = statusText.substring(0, 97) + '...';
    
    console.log(LoggerPrefix, `[SlackNowPlaying] Status text: "${statusText}"`);
    
    // Calculate expiration time (current time + remaining song duration)
    const elapsed = songInfo.elapsedSeconds ?? 0;
    const remaining = Math.max(0, Math.floor(songInfo.songDuration - elapsed));
    const expirationTime = Math.floor(Date.now() / 1000) + remaining;
    
    console.log(LoggerPrefix, `[SlackNowPlaying] Expiration time: ${new Date(expirationTime * 1000).toLocaleTimeString()}`);
    
    await updateSlackStatusWithEmoji(statusText, expirationTime, songInfo, config);
  } catch (error) {
    console.error(LoggerPrefix, '[SlackNowPlaying] Error setting now playing status:', error);
  }
}

async function updateSlackStatusWithEmoji(
  statusText: string,
  expirationTime: number,
  songInfo: SongInfo,
  config: SlackNowPlayingConfig,
) {
  console.log(LoggerPrefix, '[SlackNowPlaying] Updating Slack status with emoji');
  
  try {
    validateConfig(config);
    const client = new SlackApiClient(config.token, config.cookieToken);
    
    console.log(LoggerPrefix, '[SlackNowPlaying] Getting status emoji');
    const statusEmoji = await getStatusEmoji(songInfo, config);
    console.log(LoggerPrefix, `[SlackNowPlaying] Using emoji: ${statusEmoji}`);
    
    const profileData = {
      status_text: statusText,
      status_emoji: statusEmoji,
      status_expiration: expirationTime,
    };
    
    const postData = {
      token: config.token,
      profile: JSON.stringify(profileData),
    };
    
    console.log(LoggerPrefix, '[SlackNowPlaying] Sending request to Slack API');
    const res = await client.post('users.profile.set', postData);
    const json = res.data as SlackApiResponse;
    
    if (!json.ok) {
      console.error(LoggerPrefix, `[SlackNowPlaying] Slack API error: ${json.error}`);
    } else {
      console.log(LoggerPrefix, '[SlackNowPlaying] Successfully updated Slack status');
      state.lastStatus = statusText;
      state.lastEmoji = statusEmoji;
    }
  } catch (error) {
    console.error(LoggerPrefix, '[SlackNowPlaying] Error updating Slack status:', error);
  }
}

async function getStatusEmoji(songInfo: SongInfo, config: SlackNowPlayingConfig): Promise<string> {
  if (songInfo.imageSrc) {
    const emojiUploaded = await uploadEmojiToSlack(songInfo, config);
    if (emojiUploaded) {
      return `:${config.emojiName}:`;
    }
  }
  return defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)];
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
  console.error(`[SlackNowPlaying] Error uploading emoji: ${json.error}`);
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
    console.error('[SlackNowPlaying] Error saving album art to file:', error);
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
    console.error(`[SlackNowPlaying] Error checking emoji list: ${json.error}`);
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
  console.error(`[SlackNowPlaying] Error deleting emoji: ${json.error}`);
  return false;
}

export const backend = createBackend({
  async start(ctx) {
    console.log(LoggerPrefix, '[SlackNowPlaying] Starting plugin');
    state.window = ctx.window;
    
    // Get the config
    const config = await ctx.getConfig();
    console.log(LoggerPrefix, '[SlackNowPlaying] Config loaded:', config.enabled ? 'enabled' : 'disabled');
    
    // Register callback to listen for song changes
    registerCallback((songInfo, event) => {
      // Skip time change events
      if (event === SongInfoEvent.TimeChanged) return;
      
      console.log(LoggerPrefix, `[SlackNowPlaying] Song info event: ${event}`);
      
      // Only update if plugin is enabled
      if (!config.enabled) {
        console.log(LoggerPrefix, '[SlackNowPlaying] Plugin is disabled, not updating status');
        return;
      }
      
      // Update Slack status with current song
      try {
        // Check if config has the expected structure
        const slackConfig = config as any;
        if (!slackConfig || typeof slackConfig !== 'object') {
          console.error(LoggerPrefix, '[SlackNowPlaying] Invalid config object');
          return;
        }
        
        // Log the config for debugging
        console.log(LoggerPrefix, '[SlackNowPlaying] Config:', JSON.stringify({
          enabled: slackConfig.enabled,
          hasToken: Boolean(slackConfig.token),
          hasCookieToken: Boolean(slackConfig.cookieToken),
          hasEmojiName: Boolean(slackConfig.emojiName)
        }));
        
        // Make sure the config has the required properties
        if (!slackConfig.token || !slackConfig.cookieToken || !slackConfig.emojiName) {
          console.error(LoggerPrefix, '[SlackNowPlaying] Missing required config values');
          return;
        }
        
        console.log(LoggerPrefix, '[SlackNowPlaying] Updating status with song:', songInfo.title);
        setNowPlaying(songInfo, slackConfig)
          .catch(error => console.error(LoggerPrefix, '[SlackNowPlaying] Error in callback:', error));
      } catch (error) {
        console.error(LoggerPrefix, '[SlackNowPlaying] Error processing song info:', error);
      }
    });
    
    console.log(LoggerPrefix, '[SlackNowPlaying] Registered song info callback');
  },
  
  async stop() {
    console.log(LoggerPrefix, '[SlackNowPlaying] Stopping plugin');
    state.window = undefined;
    // Note: We don't unregister the callback as there's no API for that
    // It will be garbage collected when the plugin is unloaded
  },
  
  async onConfigChange(newConfig) {
    console.log(LoggerPrefix, '[SlackNowPlaying] Config changed:', newConfig.enabled ? 'enabled' : 'disabled');
  },
});
