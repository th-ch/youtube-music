import { BrowserWindow, net } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SlackApiClient, SlackApiResponse } from './slack-api-client';
import FormData from 'form-data';

import { ScrobblerBase } from './base';

import type { ScrobblerPluginConfig } from '../index';
import type { SetConfType } from '../main';
import type { SongInfo } from '@/providers/song-info';

interface SlackProfileData {
  status_text: string;
  status_emoji: string;
  status_expiration?: number;
}

interface SlackProfileUpdateData {
  token: string;
  profile: string; // JSON stringified profile data
}

/**
 * SlackScrobbler: Handles Slack status and emoji updates for the scrobbler plugin
 */
export class SlackScrobbler extends ScrobblerBase {
  mainWindow: BrowserWindow;
  defaultEmojis = [':cd:', ':headphones:', ':musical_note:', ':notes:', ':radio:'];

  constructor(mainWindow: BrowserWindow) {
    super();
    this.mainWindow = mainWindow;
  }

  /**
   * Validates that all required Slack config values are present.
   */
  private static validateConfig(config: ScrobblerPluginConfig): asserts config is ScrobblerPluginConfig & {
    scrobblers: { slack: { token: string; cookieToken: string; emojiName: string } }
  } {
    const slack = config.scrobblers.slack;
    if (!slack.token || !slack.cookieToken || !slack.emojiName) {
      throw new Error('Missing Slack config values');
    }
  }

  override isSessionCreated(config: ScrobblerPluginConfig): boolean {
    try {
      SlackScrobbler.validateConfig(config);
      return true;
    } catch {
      return false;
    }
  }

  override async createSession(
    config: ScrobblerPluginConfig,
    setConfig: SetConfType,
  ): Promise<ScrobblerPluginConfig> {
    // Session creation is not required for Slack
    setConfig(config);
    return config;
  }

  override setNowPlaying(
    songInfo: SongInfo,
    config: ScrobblerPluginConfig,
    _setConfig: SetConfType,
  ): void {
    if (!this.isSessionCreated(config)) return;
    const title = config.alternativeTitles && songInfo.alternativeTitle !== undefined
      ? songInfo.alternativeTitle
      : songInfo.title;
    const artistPart = songInfo.artist || 'Unknown Artist';
    const truncatedArtist = artistPart.length > 50 ? artistPart.substring(0, 50) + '...' : artistPart;
    let statusText = `Now Playing: ${truncatedArtist} - ${title}`;
    if (statusText.length > 97) statusText = statusText.substring(0, 97) + '...';
    // Calculate expiration time (current time + remaining song duration)
    const elapsed = songInfo.elapsedSeconds ?? 0;
    const remaining = Math.max(0, Math.floor(songInfo.songDuration - elapsed));
    const expirationTime = Math.floor(Date.now() / 1000) + remaining;
    this.updateSlackStatusWithEmoji(statusText, expirationTime, songInfo, config);
  }

  override addScrobble(
    _songInfo: SongInfo,
    _config: ScrobblerPluginConfig,
    _setConfig: SetConfType,
  ): void {
    // No action needed; status is managed by setNowPlaying
  }

  /**
   * Deletes an existing custom emoji from Slack.
   */
  private async deleteExistingEmoji(config: ScrobblerPluginConfig): Promise<boolean> {
    SlackScrobbler.validateConfig(config);
    const slack = config.scrobblers.slack;
    const client = new SlackApiClient(slack.token, slack.cookieToken);
    const data = { token: slack.token, name: slack.emojiName };
    const res = await client.post('emoji.remove', data);
    const json = res.data as SlackApiResponse;
    if (json.ok || json.error === 'emoji_not_found') return true;
    console.error(`[SlackScrobbler] Error deleting emoji: ${json.error}`);
    return false;
  }

  /**
   * Ensures the custom emoji does not exist (deletes if present).
   */
  private async ensureEmojiDoesNotExist(config: ScrobblerPluginConfig): Promise<boolean> {
    SlackScrobbler.validateConfig(config);
    const slack = config.scrobblers.slack;
    const client = new SlackApiClient(slack.token, slack.cookieToken);
    const res = await client.get('emoji.list', { token: slack.token });
    const json = res.data as SlackApiResponse;
    if (json.ok) {
      if (json.emoji && json.emoji[slack.emojiName]) {
        return await this.deleteExistingEmoji(config);
      } else {
        return true;
      }
    } else {
      console.error(`[SlackScrobbler] Error checking emoji list: ${json.error}`);
      return false;
    }
  }

  /**
   * Uploads a new custom emoji to Slack.
   */
  private async uploadEmojiToSlack(filePath: string, config: ScrobblerPluginConfig): Promise<boolean> {
    SlackScrobbler.validateConfig(config);
    const slack = config.scrobblers.slack;
    const client = new SlackApiClient(slack.token, slack.cookieToken);
    const emojiDeleted = await this.ensureEmojiDoesNotExist(config);
    if (!emojiDeleted) return false;
    const formData = new FormData();
    formData.append('token', slack.token);
    formData.append('mode', 'data');
    formData.append('name', slack.emojiName);
    const fileBuffer = fs.readFileSync(filePath);
    formData.append('image', fileBuffer, {
      filename: 'album-art.jpg',
      contentType: 'image/jpeg',
    });
    const res = await client.post('emoji.add', formData, true);
    const json = res.data as SlackApiResponse;
    if (json.ok) return true;
    console.error(`[SlackScrobbler] Error uploading emoji: ${json.error}`);
    return false;
  }

  /**
   * Sets the user's Slack status with the current track and emoji.
   */
  private async updateSlackStatusWithEmoji(
    statusText: string,
    expirationTime: number,
    songInfo: SongInfo,
    config: ScrobblerPluginConfig,
  ): Promise<void> {
    SlackScrobbler.validateConfig(config);
    const slack = config.scrobblers.slack;
    const client = new SlackApiClient(slack.token, slack.cookieToken);
    const statusEmoji = await this.getStatusEmoji(songInfo, config);
    const profileData: SlackProfileData = {
      status_text: statusText,
      status_emoji: statusEmoji,
      status_expiration: expirationTime,
    };
    const postData: SlackProfileUpdateData = {
      token: slack.token,
      profile: JSON.stringify(profileData),
    };
    const res = await client.post('users.profile.set', postData);
    const json = res.data as SlackApiResponse;
    if (!json.ok) {
      console.error(`Slack API error: ${json.error}`);
    }
  }

  /**
   * Saves album art to a temporary file for emoji upload.
   */
  private async saveAlbumArtToFile(songInfo: SongInfo): Promise<string | null> {
    if (!songInfo.imageSrc) return null;
    try {
      const tempDir = os.tmpdir();
      const filePath = path.join(tempDir, 'album-art.jpg');
      const response = await net.fetch(songInfo.imageSrc);
      const imageBuffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filePath, imageBuffer);
      return filePath;
    } catch (error) {
      console.error('Error saving album art to file:', error);
      return null;
    }
  }

  /**
   * Gets the emoji to use for the current status (uploads album art if possible).
   */
  private async getStatusEmoji(songInfo: SongInfo, config: ScrobblerPluginConfig): Promise<string> {
    if (songInfo.imageSrc) {
      const filePath = await this.saveAlbumArtToFile(songInfo);
      if (filePath) {
        const uploaded = await this.uploadEmojiToSlack(filePath, config);
        if (uploaded) {
          return `:${config.scrobblers.slack.emojiName}:`;
        }
      }
    }
    return this.getDefaultEmoji();
  }

  private getDefaultEmoji(): string {
    // Return a random default emoji
    const randomIndex = Math.floor(Math.random() * this.defaultEmojis.length);
    return this.defaultEmojis[randomIndex];
  }
}
