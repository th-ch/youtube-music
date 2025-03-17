import { createSignal } from 'solid-js';

export default () => {
  const [experimentalFeatures, setExperimentalFeatures] = createSignal(false);
  const [debugMode, setDebugMode] = createSignal(false);

  return (
    <div class="ytmd-sui-settingsContent">
      <div class="ytmd-sui-settingItem">
        <div class="ytmd-sui-settingText">
          <div class="ytmd-sui-settingLabel">
            <span class="ytmd-sui-settingTitle">Experimental features</span>
            <span class="ytmd-sui-settingDescription">
              Enable experimental features and updates
            </span>
          </div>
          <div
            class="ytmd-sui-toggle"
            onClick={() => setExperimentalFeatures(!experimentalFeatures())}
          >
            <div class="ytmd-sui-toggleHandle"></div>
          </div>
        </div>
      </div>

      <div class="ytmd-sui-settingItem">
        <div class="ytmd-sui-settingText">
          <div class="ytmd-sui-settingLabel">
            <span class="ytmd-sui-settingTitle">Debug mode</span>
            <span class="ytmd-sui-settingDescription">
              Show additional debugging information
            </span>
          </div>
          <div
            class="ytmd-sui-toggle"
            onClick={() => setDebugMode(!debugMode())}
          >
            <div class="ytmd-sui-toggleHandle"></div>
          </div>
        </div>
      </div>

      <div class="ytmd-sui-settingItem">
        <div class="ytmd-sui-settingText">
          <div class="ytmd-sui-settingLabel">
            <span class="ytmd-sui-settingTitle">Export configuration</span>
            <span class="ytmd-sui-settingDescription">
              Download your current configuration
            </span>
          </div>
          <button class="ytmd-sui-actionButton">Export</button>
        </div>
      </div>
    </div>
  );
};
