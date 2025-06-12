import { createSignal } from 'solid-js';
import { Toggle } from '../Toggle';
import { Select } from '../Select';
import { t } from '@/i18n';

export default () => {
  const [removeUpgradeButton, setRemoveUpgradeButton] = createSignal(false);
  const [likeButtons, setLikeButtons] = createSignal('');

  // prettier-ignore
  const t$ = (key: string) => t(`main.menu.options.submenu.visual-tweaks.submenu.${key}`);

  return (
    <div class="ytmd-sui-settingsContent">
      <Toggle
        label={t$('remove-upgrade-button')}
        description="Remove the upgrade button from the sidebar"
        value={removeUpgradeButton()}
        toggle={() => setRemoveUpgradeButton((old) => !old)}
      />

      <Select
        label={t$('like-buttons.label')}
        description="todo!()"
        value={likeButtons()}
        options={[
          { label: t$('like-buttons.default'), value: '' },
          { label: t$('like-buttons.force-show'), value: 'force' },
          { label: t$('like-buttons.hide'), value: 'hide' },
        ]}
        onSelect={(value) => setLikeButtons(value)}
      />
    </div>
  );
};
