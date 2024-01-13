import { SetConfType } from '@/plugins/scrobbler/main';
import { SongInfo } from '@/providers/song-info';
import { ScrobblerPluginConfig } from '@/plugins/scrobbler';

export abstract class ScrobblerBase {
  public abstract createSession(config: ScrobblerPluginConfig, setConfig: SetConfType): Promise<ScrobblerPluginConfig>;

  public abstract setNowPlaying(songInfo: SongInfo, config: ScrobblerPluginConfig, setConfig: SetConfType): void;

  public abstract addScrobble(songInfo: SongInfo, config: ScrobblerPluginConfig, setConfig: SetConfType): void;
}
