import { createEffect, createSignal, lazy, Setter, Show } from 'solid-js';
import { languageResources } from 'virtual:i18n';
import { t } from '@/i18n';

import * as data from '@/providers/extracted-data';
import { debounce } from '@/providers/decorators';

import { getPlatform, Config } from '../../renderer';

import { Toggle } from '../Toggle';
import { Select } from '../Select';

const Impl = (props: {
  platform: string;
  languages: { label: string; value: string }[];
}) => {
  const startingPages = [{ label: 'Unset', value: '' }].concat(
    Object.keys(data.startingPages).map((key) => ({
      label: key,
      value: key,
    })),
  );

  const { options: opts } = Config.signal();
  type DirtableValue<T> = { dirty: boolean; value: T };

  const dty = <T,>(value: T): DirtableValue<T> => ({ dirty: false, value });

  const [autoUpdates, setAutoUpdates] = createSignal(dty(opts.autoUpdates));
  const [startOnLogin, setStartOnLogin] = createSignal(dty(opts.startAtLogin));
  const [autoResume, setAutoResume] = createSignal(dty(opts.resumeOnStart));
  const [startingPage, setStartingPage] = createSignal(dty(opts.startingPage));
  const [alwaysOnTop, setAlwaysOnTop] = createSignal(dty(opts.alwaysOnTop));
  const [hideMenu, setHideMenu] = createSignal(dty(opts.hideMenu));
  const [language, setLanguage] = createSignal(dty(opts.language ?? 'en'));

  /**
   * propagate external config changes to the settings UI
   */
  createEffect(() => {
    const { options } = Config.signal();

    const changeIfClean =
      <T,>(value: T) =>
      (old: { dirty: boolean; value: T }) => {
        if (old.dirty) return old;
        return { dirty: false, value };
      };

    setAutoUpdates(changeIfClean(options.autoUpdates));
    setStartOnLogin(changeIfClean(options.startAtLogin));
    setAutoResume(changeIfClean(options.resumeOnStart));
    setStartingPage(changeIfClean(options.startingPage));
    setAlwaysOnTop(changeIfClean(options.alwaysOnTop));
    setHideMenu(changeIfClean(options.hideMenu));
    setLanguage(changeIfClean(options.language ?? 'en'));
  });

  const debouncers: Record<string, CallableFunction> = {};
  const updateIfDirty = <T,>(
    key: Parameters<typeof Config.get>[0],
    { dirty, value }: DirtableValue<T>,
    setter: Setter<DirtableValue<T>>,
  ) => {
    debouncers[key] ??= debounce(
      async (
        { dirty, value }: DirtableValue<T>,
        setter: Setter<DirtableValue<T>>,
      ) => {
        if (dirty) {
          console.log(`${key} = ${value}`);
          setter({ dirty: false, value });
          await Config.set(key, value as any);
        }
      },
      200,
    );

    debouncers[key]({ dirty, value }, setter);
  };

  createEffect(() => {
    updateIfDirty('options.autoUpdates', autoUpdates(), setAutoUpdates);
    updateIfDirty('options.startAtLogin', startOnLogin(), setStartOnLogin);
    updateIfDirty('options.resumeOnStart', autoResume(), setAutoResume);
    updateIfDirty('options.startingPage', startingPage(), setStartingPage);
    updateIfDirty('options.alwaysOnTop', alwaysOnTop(), setAlwaysOnTop);
    updateIfDirty('options.hideMenu', hideMenu(), setHideMenu);
    updateIfDirty('options.language', language(), setLanguage);
  });

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
          value={startOnLogin().value}
          toggle={() =>
            setStartOnLogin(({ value }) => ({ dirty: true, value: !value }))
          }
        />
      </Show>

      <Select
        label={t$('language.label') + ' (Language)'}
        description="Select the language for the application"
        value={language().value}
        options={props.languages}
        onSelect={(value) => setLanguage({ dirty: true, value })}
      />

      <Select
        label={t$('starting-page.label')}
        description="Select which page to show when the application starts"
        value={startingPage().value}
        options={startingPages}
        onSelect={(value) => setStartingPage({ dirty: true, value })}
      />

      <Toggle
        label={t$('auto-update')}
        description="Automatically get notified about new versions"
        value={autoUpdates().value}
        toggle={() =>
          setAutoUpdates(({ value }) => ({ dirty: true, value: !value }))
        }
      />

      <Toggle
        label={t$('resume-on-start')}
        description="Resume last song when app starts"
        value={autoResume().value}
        toggle={() =>
          setAutoResume(({ value }) => ({ dirty: true, value: !value }))
        }
      />

      <Toggle
        label={t$('always-on-top')}
        description="Keep the application window on top of other windows"
        value={alwaysOnTop().value}
        toggle={() =>
          setAlwaysOnTop(({ value }) => ({ dirty: true, value: !value }))
        }
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
          value={hideMenu().value}
          toggle={() =>
            setHideMenu(({ value }) => ({ dirty: true, value: !value }))
          }
        />
      </Show>
    </div>
  );
};

export default lazy(async () => {
  const langRes = languageResources;

  type LanguageOption = { label: string; value: string };

  const languages = Object.keys(langRes)
    .reduce(
      // prettier-ignore
      (acc, lang) => {
        const englishName = langRes[lang].translation.language?.name ?? 'Unknown';
        const nativeName = langRes[lang].translation.language?.['local-name'] ?? 'Unknown';

        acc.push({
          label: `${englishName} (${nativeName})`,
          value: lang,
        });

        return acc;
      },
      [] as LanguageOption[],
    )
    .sort(({ label: A }, { label: B }) => A.localeCompare(B));

  const platform = await getPlatform();

  return {
    default: () => <Impl platform={platform} languages={languages} />,
  };
});
