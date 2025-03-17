import { createSignal } from 'solid-js';

export default () => {
  const [darkMode, setDarkMode] = createSignal(true);
  const [compactMode, setCompactMode] = createSignal(false);
  const [fontSize, setFontSize] = createSignal(14);

  return (
    <div class="ytmd-sui-settingsContent">
      <div class="ytmd-sui-settingItem">
        <div class="ytmd-sui-settingText">
          <div class="ytmd-sui-settingLabel">
            <span class="ytmd-sui-settingTitle">Dark mode</span>
            <span class="ytmd-sui-settingDescription">
              Switch between light and dark themes
            </span>
          </div>
          <div class="ytmd-sui-toggle" onClick={() => setDarkMode(!darkMode())}>
            <div class="ytmd-sui-toggleHandle"></div>
          </div>
        </div>
      </div>

      <div class="ytmd-sui-settingItem">
        <div class="ytmd-sui-settingText">
          <div class="ytmd-sui-settingLabel">
            <span class="ytmd-sui-settingTitle">Compact mode</span>
            <span class="ytmd-sui-settingDescription">
              Reduce spacing between elements
            </span>
          </div>
          <div
            class="ytmd-sui-toggle"
            onClick={() => setCompactMode(!compactMode())}
          >
            <div class="ytmd-sui-toggleHandle"></div>
          </div>
        </div>
      </div>

      <div class="ytmd-sui-settingItem">
        <div class="ytmd-sui-settingText">
          <div class="ytmd-sui-settingLabel">
            <span class="ytmd-sui-settingTitle">Font size</span>
            <span class="ytmd-sui-settingDescription">
              Adjust the base font size
            </span>
          </div>
          <div class="ytmd-sui-rangeControl">
            <input
              type="range"
              min="12"
              max="20"
              value={fontSize()}
              onInput={(e) => setFontSize(parseInt(e.currentTarget.value))}
            />
            <span class="ytmd-sui-rangeValue">{fontSize()}px</span>
          </div>
        </div>
      </div>
    </div>
  );
};
