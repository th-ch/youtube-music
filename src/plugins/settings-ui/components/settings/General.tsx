import { createSignal, Show } from 'solid-js';
import { languageResources } from 'virtual:i18n';
import { Toggle } from '../Toggle';
import { Select } from '../Select';
import { t } from '@/i18n';
import { getPlatform } from '../../renderer';

// prettier-ignore
export default () => {
  const languages = Object.keys(languageResources)
    .reduce((acc, lang) => {
      const label = `${languageResources[lang].translation.language?.name ?? 'Unknown'} (${languageResources[lang].translation.language?.['local-name'] ?? 'Unknown'})`
      acc.push({
        label,
        value: lang
      });
      return acc;
    }, [] as { label: string; value: string; }[]);

  const [checkForUpdates, setCheckForUpdates] = createSignal(true);
  const [startOnLogin, setStartOnLogin] = createSignal(false);
  const [resumeOnStartup, setResumeOnStartup] = createSignal(false);
  const [startingPage, setStartingPage] = createSignal('');
  const [singleInstanceLock, setSingleInstanceLock] = createSignal(true);
  const [alwaysOnTop, setAlwaysOnTop] = createSignal(false);
  const [hideMenu, setHideMenu] = createSignal(false);
  const [language, setLanguage] = createSignal('en');

  const [platform, setPlatform] = createSignal('');
  getPlatform().then(setPlatform);

  const t$ = (key: string) => t(`main.menu.options.submenu.${key}`);

  return (
    <div class="ytmd-sui-settingsContent">
      <Show when={platform().startsWith('Windows') || platform().startsWith('macOS')}>
        <Toggle
          label={t$('start-at-login')}
          description="Start youtube-music on login"
          value={startOnLogin()}
          toggle={() => setStartOnLogin((old) => !old)}
        />
      </Show>

      <Select
        label={t$('language.label') + ' (Language)'}
        description="Select the language for the application"
        value={language()}
        options={languages}
        onSelect={(value) => setLanguage(value)}
      />

      <Select
        label={t$('starting-page.label')}
        description="Select which page to show when the application starts"
        value={startingPage()}
        options={[
          { label: 'Default', value: '' },
          { label: 'Home', value: 'FEmusic_home' },
          { label: 'Explore', value: 'FEmusic_explore' },
          { label: 'New Releases', value: 'FEmusic_new_releases' },
          { label: 'Charts', value: 'FEmusic_charts' },
          { label: 'Moods & Genres', value: 'FEmusic_moods_and_genres' },
          { label: 'Library', value: 'FEmusic_library_landing' },
          { label: 'Playlists', value: 'FEmusic_liked_playlists' },
          { label: 'Songs', value: 'FEmusic_liked_videos' },
          { label: 'Albums', value: 'FEmusic_liked_albums' },
          { label: 'Artists', value: 'FEmusic_library_corpus_track_artists' },
          { label: 'Subscribed Artists', value: 'FEmusic_library_corpus_artists' },
          { label: 'Uploads', value: 'FEmusic_library_privately_owned_landing' },
          { label: 'Uploaded Playlists', value: 'FEmusic_liked_playlists' },
          { label: 'Uploaded Songs', value: 'FEmusic_library_privately_owned_tracks' },
          { label: 'Uploaded Albums', value: 'FEmusic_library_privately_owned_releases' },
          { label: 'Uploaded Artists', value: 'FEmusic_library_privately_owned_artists' },
        ]}
        onSelect={(value) => setStartingPage(value)}
      />

      <Toggle
        label={t$('auto-update')}
        description="Automatically get notified about new versions"
        value={checkForUpdates()}
        toggle={() => setCheckForUpdates((old) => !old)}
      />

      <Toggle
        label={t$('resume-on-start')}
        description="Resume last song when app starts"
        value={resumeOnStartup()}
        toggle={() => setResumeOnStartup((old) => !old)}
      />

      <Toggle
        label={t$('single-instance-lock')}
        description="Prevent multiple instances of the application running at the same time"
        value={singleInstanceLock()}
        toggle={() => setSingleInstanceLock((old) => !old)}
      />

      <Toggle
        label={t$('always-on-top')}
        description="Keep the application window on top of other windows"
        value={alwaysOnTop()}
        toggle={() => setAlwaysOnTop((old) => !old)}
      />

      <Show when={platform().startsWith('Windows') || platform().startsWith('Linux')}>
        <Toggle
          label={t$('hide-menu.label')}
          description="Hide the menu bar"
          value={hideMenu()}
          toggle={() => setHideMenu((old) => !old)}
        />
      </Show>
    </div>
  );
};
