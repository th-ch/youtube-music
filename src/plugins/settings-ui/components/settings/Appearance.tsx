import { createSignal } from 'solid-js';
import { Toggle } from '../Toggle';
import { Select } from '../Select';

export default () => {
  const [removeUpgradeButton, setRemoveUpgradeButton] = createSignal(false);
  const [likeButtons, setLikeButtons] = createSignal('');

  return (
    <div class="ytmd-sui-settingsContent">
      <Toggle
        label="Remove Upgrade Button"
        description="Remove the upgrade button from the sidebar"
        value={removeUpgradeButton()}
        toggle={() => setRemoveUpgradeButton((old) => !old)}
      />

      <Select
        label="Like Buttons"
        description="todo!()"
        value={likeButtons()}
        options={[
          { label: 'Default', value: '' },
          { label: 'Force Show', value: 'force' },
          { label: 'Hide', value: 'hide' },
        ]}
        onSelect={(value) => setLikeButtons(value)}
      />
    </div>
  );
};
