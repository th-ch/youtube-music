import { createEffect, createSignal, For, Show } from 'solid-js';
import { getAppVersion, getPlatform, getVersions } from '../../renderer';

export default () => {
  const [appVersion, setAppVersion] = createSignal('');
  const [platform, setPlatform] = createSignal('');
  const [versions, setVersions] = createSignal<Record<string, string>>({});

  createEffect(async () => {
    setAppVersion(await getAppVersion());
    setPlatform(await getPlatform());
    setVersions(await getVersions());
  });

  return (
    <div class="ytmd-sui-settingsContent">
      <div class="ytmd-sui-aboutSection">
        <h3>
          <span class="ytmd-sui-about-guser">th-ch/</span>
          <span class="ytmd-sui-about-grepo">youtube-music</span>
        </h3>
        <p class="ytmd-sui-version">
          v{appVersion()}
          {import.meta.env.DEV ? ' (dev)' : ''}
        </p>
        <p class="ytmd-sui-description">
          YouTube Music Desktop App bundled with custom plugins (and built-in ad
          blocker / downloader)
        </p>
      </div>

      <div class="ytmd-sui-aboutSection">
        <h4>System Information</h4>
        <div class="ytmd-sui-systemInfo">
          <div class="ytmd-sui-infoRow">
            <span>Operating System</span>
            <span>{platform()}</span>
          </div>
          <For each={['electron', 'chrome', 'node', 'v8']}>
            {(name) => (
              <Show when={versions()[name]}>
                <div class="ytmd-sui-infoRow">
                  <span>{name === 'chrome' ? 'chromium' : name}</span>
                  <span>{versions()[name]}</span>
                </div>
              </Show>
            )}
          </For>
        </div>
      </div>

      {/* <div class="ytmd-sui-aboutSection">
        <button class="ytmd-sui-actionButton">Check for Updates</button>
        <button class="ytmd-sui-actionButton">View Licenses</button>
      </div> */}
    </div>
  );
};
