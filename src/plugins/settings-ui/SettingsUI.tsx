import { createSignal, For } from 'solid-js';
import { rendererPlugins } from 'virtual:plugins';
import { PluginCard } from './components/PluginCard';
import { SectionTitle } from './components/SectionTitle';

interface SettingsUIProps {
  closeModal: () => void;
}

export const SettingsUI = (props: SettingsUIProps) => {
  const [plugins, setPlugins] = createSignal(Object.entries(rendererPlugins));

  const togglePlugin = (id: string) => {
    setPlugins((prev) =>
      prev.map(([key, plugin]) =>
        key === id
          ? [
              key,
              {
                ...plugin,
                config: {
                  ...(plugin.config ?? {}),
                  enabled: !plugin.config?.enabled,
                },
              },
            ]
          : [key, plugin]
      )
    );
  };

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.closeModal();
    }
  };

  return (
    <div class="modal-backdrop" onClick={handleOverlayClick}>
      <div class="modal-content">
        <div style={{ padding: '1rem' }}>
          <SectionTitle title="Plugins" />
          // TODO: Make this responsive
          <div class="ytmd-settings-ui-plugins-grid">
            <For each={plugins()}>
              {([id, plugin]) => (
                <PluginCard
                  plugin={plugin}
                  togglePlugin={() => togglePlugin(id)}
                />
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
};
