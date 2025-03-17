import { createSignal } from 'solid-js';

export default () => {
  const [autoSave, setAutoSave] = createSignal(true);
  const [notifications, setNotifications] = createSignal(false);

  return (
    <div class="ytmd-sui-settingsContent">
      <div class="ytmd-sui-settingItem">
        <div class="ytmd-sui-settingText">
          <div class="ytmd-sui-settingLabel">
            <span class="ytmd-sui-settingTitle">Auto-save changes</span>
            <span class="ytmd-sui-settingDescription">
              Automatically save your changes as you type
            </span>
          </div>
          <div class="ytmd-sui-toggle" onClick={() => setAutoSave(!autoSave())}>
            <div class="ytmd-sui-toggleHandle"></div>
          </div>
        </div>
      </div>

      <div class="ytmd-sui-settingItem">
        <div class="ytmd-sui-settingText">
          <div class="ytmd-sui-settingLabel">
            <span class="ytmd-sui-settingTitle">Enable notifications</span>
            <span class="ytmd-sui-settingDescription">
              Receive notifications about updates and changes
            </span>
          </div>
          <div
            class="ytmd-sui-toggle"
            onClick={() => setNotifications(!notifications())}
          >
            <div class="ytmd-sui-toggleHandle"></div>
          </div>
        </div>
      </div>

      <div class="ytmd-sui-settingItem">
        <div class="ytmd-sui-settingText">
          <div class="ytmd-sui-settingLabel">
            <span class="ytmd-sui-settingTitle">Clear all data</span>
            <span class="ytmd-sui-settingDescription">
              This will permanently delete all your data
            </span>
          </div>
          <button class="ytmd-sui-deleteButton">Delete all</button>
        </div>
      </div>
    </div>
  );
};
