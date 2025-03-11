import { createSignal, For, Match, Switch } from 'solid-js';
import { rendererPlugins } from 'virtual:plugins';
import { PluginCard } from './components/PluginCard';

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

  const filteredPlugins = () => {
    return plugins();

    // TODO: Add search
    // const searchTerm = search().toLowerCase();
    // return plugins().filter(
    //   ([_, plugin]) =>
    //     plugin.name().toLowerCase().includes(searchTerm) ||
    //     plugin.description?.()?.toLowerCase()?.includes(searchTerm)
    // );
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
          <yt-formatted-string
            class="title text style-scope ytmusic-carousel-shelf-basic-header-renderer"
            text={{ runs: [{ text: 'Plugins' }] }}
          />
          <div class="ytmd-settings-ui-plugins-grid">
            <For each={filteredPlugins()}>
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
