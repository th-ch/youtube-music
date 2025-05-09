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

/**
 * Updates the Slack status with the currently playing song
 * @param songInfo Information about the current song
 * @param config Plugin configuration
 */
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
    // Provide more detailed error information based on error type
    if (error instanceof Error) {
      console.error(`Error setting Slack status: ${error.message}`, {
        name: error.name,
        stack: error.stack
      });
    } else {
      console.error(`Error setting Slack status: ${String(error)}`);
    }
    
    // Re-throw specific errors that should be handled by the caller
    if (error instanceof Error && 
        (error.message.includes('token') || error.message.includes('authentication'))) {
      throw new Error('Slack authentication failed. Please check your API token and cookie token.');
    }
  }
}

/**
 * Updates the Slack status with emoji and text
 * @param statusText The status text to set
 * @param expirationTime When the status should expire
 * @param songInfo Information about the current song
 * @param config Plugin configuration
 * @throws Error if the Slack API request fails
 */
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
      // Handle specific API error codes
      const errorMessage = `Slack API error: ${json.error}`;
      console.error(errorMessage, { response: json });
      
      // Throw specific errors based on the error type
      if (json.error === 'invalid_auth' || json.error === 'token_expired') {
        throw new Error('Slack authentication failed. Please check your API token and cookie token.');
      } else if (json.error === 'rate_limited') {
        throw new Error('Slack API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(errorMessage);
      }
    } else {
      state.lastStatus = statusText;
      state.lastEmoji = statusEmoji;
    }
  } catch (error) {
    // Provide more detailed error information based on error type
    if (error instanceof Error) {
      console.error(`Error updating Slack status: ${error.message}`, {
        name: error.name,
        stack: error.stack
      });
    } else {
      console.error(`Error updating Slack status: ${String(error)}`);
    }
    
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

async function getStatusEmoji(songInfo: SongInfo, config: SlackNowPlayingConfig): Promise<string> {
  if (songInfo.imageSrc && await uploadEmojiToSlack(songInfo, config)) {
    return `:${config.emojiName}:`;
  }

  const randomIndex = Math.floor(Math.random() * defaultEmojis.length);
  return defaultEmojis[randomIndex];
}

/**
 * Uploads album art to Slack as a custom emoji
 * @param songInfo Information about the current song
 * @param config Plugin configuration
 * @returns True if the emoji was successfully uploaded, false otherwise
 */
async function uploadEmojiToSlack(songInfo: SongInfo, config: SlackNowPlayingConfig): Promise<boolean> {
  try {
    validateConfig(config);
    const client = new SlackApiClient(config.token, config.cookieToken);
    
    // Save album art to a temporary file
    const filePath = await saveAlbumArtToFile(songInfo);
    if (!filePath) {
      console.warn('Failed to save album art to file');
      return false;
    }
    
    // Make sure the emoji doesn't already exist
    const emojiDeleted = await ensureEmojiDoesNotExist(config);
    if (!emojiDeleted) {
      console.warn('Failed to ensure emoji does not exist');
      return false;
    }
    
    // Prepare the form data for the API request
    const formData = new FormData();
    formData.append('token', config.token);
    formData.append('mode', 'data');
    formData.append('name', config.emojiName);
    
    // Read the file and add it to the form data
    try {
      const fileBuffer = fs.readFileSync(filePath);
      formData.append('image', fileBuffer, {
        filename: 'album-art.jpg',
        contentType: 'image/jpeg',
      });
    } catch (fileError) {
      console.error(`Error reading album art file: ${fileError instanceof Error ? fileError.message : String(fileError)}`);
      return false;
    }
    
    // Make the API request
    const res = await client.post('emoji.add', formData, true);
    const json = res.data as SlackApiResponse;
    
    if (json.ok) return true;
    
    // Handle specific API error codes
    if (json.error === 'invalid_name') {
      console.error(`Invalid emoji name: ${config.emojiName}. Emoji names can only contain lowercase letters, numbers, hyphens, and underscores.`);
    } else if (json.error === 'too_large') {
      console.error('Album art image is too large for Slack emoji (max 128KB).');
    } else {
      console.error(`Error uploading emoji: ${json.error}`);
    }
    
    return false;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error in uploadEmojiToSlack: ${error.message}`, {
        name: error.name,
        stack: error.stack
      });
    } else {
      console.error(`Error in uploadEmojiToSlack: ${String(error)}`);
    }
    return false;
  }
}

/**
 * Downloads and saves album art to a temporary file
 * @param songInfo Information about the current song
 * @returns Path to the saved file, or null if the operation failed
 */
async function saveAlbumArtToFile(songInfo: SongInfo): Promise<string | null> {
  if (!songInfo.imageSrc) {
    console.warn('No image source available for album art');
    return null;
  }
  
  try {
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, 'album-art.jpg');
    
    // Fetch the image
    let response: Response;
    try {
      response = await net.fetch(songInfo.imageSrc);
      
      if (!response.ok) {
        console.error(`Failed to fetch album art: HTTP ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (fetchError) {
      console.error(`Network error fetching album art: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      return null;
    }
    
    // Convert the response to a buffer
    let imageBuffer: Buffer;
    try {
      imageBuffer = Buffer.from(await response.arrayBuffer());
      
      if (imageBuffer.length === 0) {
        console.error('Received empty album art image');
        return null;
      }
    } catch (bufferError) {
      console.error(`Error processing album art data: ${bufferError instanceof Error ? bufferError.message : String(bufferError)}`);
      return null;
    }
    
    // Write the buffer to a file
    try {
      fs.writeFileSync(filePath, imageBuffer);
      return filePath;
    } catch (fileError) {
      console.error(`Error writing album art to file: ${fileError instanceof Error ? fileError.message : String(fileError)}`);
      return null;
    }
  } catch (error) {
    // Catch any other unexpected errors
    if (error instanceof Error) {
      console.error(`Error saving album art to file: ${error.message}`, {
        name: error.name,
        stack: error.stack
      });
    } else {
      console.error(`Error saving album art to file: ${String(error)}`);
    }
    return null;
  }
}

/**
 * Checks if the emoji already exists and deletes it if necessary
 * @param config Plugin configuration
 * @returns True if the emoji doesn't exist or was successfully deleted, false otherwise
 */
async function ensureEmojiDoesNotExist(config: SlackNowPlayingConfig): Promise<boolean> {
  try {
    validateConfig(config);
    const client = new SlackApiClient(config.token, config.cookieToken);
    
    // Get the list of emojis
    const res = await client.get('emoji.list', { token: config.token });
    const json = res.data as SlackApiResponse;
    
    if (json.ok) {
      // Check if the emoji exists
      if (json.emoji && json.emoji[config.emojiName]) {
        return await deleteExistingEmoji(config);
      } else {
        // Emoji doesn't exist, no need to delete
        return true;
      }
    } else {
      // Handle specific API error codes
      if (json.error === 'invalid_auth' || json.error === 'token_expired') {
        console.error('Slack authentication failed. Please check your API token and cookie token.');
      } else if (json.error === 'rate_limited') {
        console.error('Slack API rate limit exceeded. Please try again later.');
      } else {
        console.error(`Error checking emoji list: ${json.error}`);
      }
      return false;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error in ensureEmojiDoesNotExist: ${error.message}`, {
        name: error.name,
        stack: error.stack
      });
    } else {
      console.error(`Error in ensureEmojiDoesNotExist: ${String(error)}`);
    }
    return false;
  }
}

/**
 * Deletes an existing emoji from Slack
 * @param config Plugin configuration
 * @returns True if the emoji was successfully deleted or doesn't exist, false otherwise
 */
async function deleteExistingEmoji(config: SlackNowPlayingConfig): Promise<boolean> {
  try {
    validateConfig(config);
    const client = new SlackApiClient(config.token, config.cookieToken);
    
    // Delete the emoji
    const data = { token: config.token, name: config.emojiName };
    const res = await client.post('emoji.remove', data);
    const json = res.data as SlackApiResponse;
    
    // Consider both success and 'emoji_not_found' as successful outcomes
    if (json.ok || json.error === 'emoji_not_found') {
      return true;
    }
    
    // Handle specific API error codes
    if (json.error === 'invalid_auth' || json.error === 'token_expired') {
      console.error('Slack authentication failed. Please check your API token and cookie token.');
    } else if (json.error === 'rate_limited') {
      console.error('Slack API rate limit exceeded. Please try again later.');
    } else {
      console.error(`Error deleting emoji: ${json.error}`);
    }
    
    return false;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error in deleteExistingEmoji: ${error.message}`, {
        name: error.name,
        stack: error.stack
      });
    } else {
      console.error(`Error in deleteExistingEmoji: ${String(error)}`);
    }
    return false;
  }
}

export const backend = createBackend({
  /**
   * Start the Slack Now Playing plugin
   * @param ctx The plugin context
   */
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
          // Log a warning only on the first occurrence to avoid spamming the console
          if (!state.lastStatus) {
            console.warn('Invalid Slack Now Playing configuration');
          }
          return;
        }

        // Make sure the config has the required properties
        if (!config.token || !config.cookieToken || !config.emojiName) {
          // Log a warning only on the first occurrence to avoid spamming the console
          if (!state.lastStatus) {
            console.warn('Missing required Slack Now Playing configuration values');
          }
          return;
        }

        // Update the Slack status
        setNowPlaying(songInfo, config).catch(error => {
          // Handle specific error types
          if (error instanceof Error) {
            // Check for authentication errors
            if (error.message.includes('authentication') || error.message.includes('token')) {
              console.error('Slack authentication failed. Please check your API token and cookie token.');
            } 
            // Check for rate limiting errors
            else if (error.message.includes('rate limit') || error.message.includes('rate_limited')) {
              console.error('Slack API rate limit exceeded. Please try again later.');
            } 
            // Generic error handling
            else {
              console.error(`Error in Slack Now Playing: ${error.message}`);
            }
          } else {
            console.error(`Error in Slack Now Playing: ${String(error)}`);
          }
        });
      } catch (error) {
        // Handle unexpected errors in the callback itself
        if (error instanceof Error) {
          console.error(`Error processing song info: ${error.message}`, {
            name: error.name,
            stack: error.stack
          });
        } else {
          console.error(`Error processing song info: ${String(error)}`);
        }
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
