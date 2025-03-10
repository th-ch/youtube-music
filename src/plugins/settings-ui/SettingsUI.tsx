import { t } from '@/i18n';
import { createSignal, For, Match, Switch } from 'solid-js';
import { rendererPlugins } from 'virtual:plugins';

interface SettingsUIProps {
  closeModal: () => void;
}

export const SettingsUI = (props: SettingsUIProps) => {
  const [search, setSearch] = createSignal('');
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
    const searchTerm = search().toLowerCase();
    return plugins().filter(
      ([_, plugin]) =>
        plugin.name().toLowerCase().includes(searchTerm) ||
        plugin.description?.()?.toLowerCase()?.includes(searchTerm)
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
        {/* <div
          style={{
            padding: '1rem',
            'border-bottom-width': '1px',
            'border-color': '#374151',
          }}
        >
          <div
            style={{
              display: 'flex',
              'margin-bottom': '1rem',
              'justify-content': 'space-between',
              'align-items': 'center',
            }}
          >
            <yt-formatted-string
              class="description style-scope ytmusic-description-shelf-renderer"
              text={{ runs: [{ text: t('plugins.settings-ui.button') }] }}
            />

            <tp-yt-paper-icon-button
              tabindex="0"
              icon="yt-icons:close"
              onClick={props.closeModal}
              class="ytmd-close-modal-button"
            />
          </div>
          <div
            style={{ display: 'flex', gap: '1rem', 'align-items': 'center' }}
          >
            <div style={{ position: 'relative', flex: '110%' }}>
              <yt-icon
                icon="yt-icons:search"
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  color: '#9CA3AF',
                }}
              />
              <input
                type="text"
                placeholder="Search for a plugin..."
                style={{ 'padding-left': '2.5rem' }}
                value={search()}
                onInput={(e) => setSearch(e.currentTarget.value)}
              />
            </div>
            <select
              style={{
                'padding-top': '0.5rem',
                'padding-bottom': '0.5rem',
                'padding-left': '0.75rem',
                'padding-right': '0.75rem',
                'border-radius': '0.25rem',
                'border-style': 'none',
                color: '#ffffff',
                cursor: 'pointer',
                background: '#202225',
              }}
            >
              <option>Show All</option>
              <option>Enabled</option>
              <option>Disabled</option>
            </select>
          </div>
        </div> */}

        <div style={{ padding: '1rem' }}>
          <yt-formatted-string
            class="title text style-scope ytmusic-carousel-shelf-basic-header-renderer"
            text={{ runs: [{ text: 'Plugins' }] }}
          />
          <div class="ytmd-settings-ui-plugins-grid">
            <For each={filteredPlugins()}>
              {([id, plugin]) => (
                <div class="plugin-card" style={{ padding: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      'justify-content': 'space-between',
                      'align-items': 'flex-start',
                    }}
                  >
                    <div style={{ flex: '110%' }}>
                      <div
                        style={{
                          display: 'flex',
                          'margin-bottom': '0.25rem',
                          gap: '0.5rem',
                          'align-items': 'center',
                        }}
                      >
                        <yt-formatted-string
                          class="description style-scope ytmusic-description-shelf-renderer"
                          style={{ 'font-weight': 700 }}
                          text={{ runs: [{ text: plugin.name() }] }}
                        />
                      </div>
                      {plugin.description && (
                        <div class="ytmd-settings-plugin-description">
                          <yt-formatted-string
                            class="description style-scope ytmusic-description-shelf-renderer"
                            text={{ runs: [{ text: plugin.description() }] }}
                          />
                        </div>
                      )}
                    </div>
                    <div class="ytmd-settings-plugin-actions">
                      <Switch
                        fallback={
                          <tp-yt-paper-icon-button
                            tabindex="0"
                            icon="yt-icons:info"
                            class="ytmd-settings-plugin-action-icon"
                          />
                        }
                      >
                        <Match
                          when={(({ enabled, ...rest }) =>
                            !!Object.keys(rest).length)(plugin.config! ?? {})}
                        >
                          <tp-yt-paper-icon-button
                            tabindex="0"
                            icon="yt-icons:settings"
                            class="ytmd-settings-plugin-action-icon"
                          />
                        </Match>
                      </Switch>
                      <div
                        class={`toggle-switch ${
                          plugin.config?.enabled ? 'active' : ''
                        }`}
                        onClick={() => togglePlugin(id)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
};
