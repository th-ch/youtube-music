import { createSignal, lazy, Show } from 'solid-js';
import { languageResources } from 'virtual:i18n';
import { t } from '@/i18n';
import type { DefaultConfig } from '@/config/defaults';

import { getPlatform, loadSettings } from '../../renderer';
import { Toggle } from '../Toggle';
import { Select } from '../Select';

const Impl = (props: {
  settings: DefaultConfig;
  platform: string;
  languages: { label: string; value: string }[];
}) => {
  const { options } = props.settings;

  const [autoUpdates, setAutoUpdates] = createSignal(options.autoUpdates);
  const [startOnLogin, setStartOnLogin] = createSignal(options.startAtLogin);
  const [autoResume, setAutoResume] = createSignal(options.resumeOnStart);
  const [startingPage, setStartingPage] = createSignal(options.startingPage);
  const [alwaysOnTop, setAlwaysOnTop] = createSignal(options.alwaysOnTop);
  const [hideMenu, setHideMenu] = createSignal(options.hideMenu);

  const [language, setLanguage] = createSignal(options.language ?? 'en');
  const t$ = (key: string) => t(`main.menu.options.submenu.${key}`);

  return (
    <div class="ytmd-sui-settingsContent ytmd-sui-scroll">
      <Show
        when={
          props.platform.startsWith('Windows') ||
          props.platform.startsWith('macOS')
        }
      >
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
        options={props.languages}
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
          {
            label: 'Subscribed Artists',
            value: 'FEmusic_library_corpus_artists',
          },
          {
            label: 'Uploads',
            value: 'FEmusic_library_privately_owned_landing',
          },
          { label: 'Uploaded Playlists', value: 'FEmusic_liked_playlists' },
          {
            label: 'Uploaded Songs',
            value: 'FEmusic_library_privately_owned_tracks',
          },
          {
            label: 'Uploaded Albums',
            value: 'FEmusic_library_privately_owned_releases',
          },
          {
            label: 'Uploaded Artists',
            value: 'FEmusic_library_privately_owned_artists',
          },
        ]}
        onSelect={(value) => setStartingPage(value)}
      />

      <Toggle
        label={t$('auto-update')}
        description="Automatically get notified about new versions"
        value={autoUpdates()}
        toggle={() => setAutoUpdates((old) => !old)}
      />

      <Toggle
        label={t$('resume-on-start')}
        description="Resume last song when app starts"
        value={autoResume()}
        toggle={() => setAutoResume((old) => !old)}
      />

      <Toggle
        label={t$('always-on-top')}
        description="Keep the application window on top of other windows"
        value={alwaysOnTop()}
        toggle={() => setAlwaysOnTop((old) => !old)}
      />

      <Show
        when={
          props.platform.startsWith('Windows') ||
          props.platform.startsWith('Linux')
        }
      >
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

export default lazy(async () => {
  const settings = await loadSettings();
  const langRes = languageResources;

  type LanguageOption = { label: string; value: string };

  const languages = Object.keys(langRes).reduce((acc, lang) => {
    const englishName = langRes[lang].translation.language?.name ?? 'Unknown';
    const nativeName =
      langRes[lang].translation.language?.['local-name'] ?? 'Unknown';

    acc.push({
      label: `${englishName} (${nativeName})`,
      value: lang,
    });

    return acc;
  }, [] as LanguageOption[]);

  const platform = await getPlatform();

  return {
    default: () => (
      <Impl settings={settings} platform={platform} languages={languages} />
    ),
  };
});
