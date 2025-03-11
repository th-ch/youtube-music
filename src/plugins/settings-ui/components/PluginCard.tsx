import { Match, Switch } from 'solid-js';
import { type Plugin } from 'virtual:plugins';

interface PluginCardProps {
  plugin: Plugin;
  togglePlugin: () => void;
}

export const PluginCard = ({ plugin, togglePlugin }: PluginCardProps) => {
  return (
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
              when={(({ enabled, ...rest }) => !!Object.keys(rest).length)(
                plugin.config! ?? {}
              )}
            >
              <tp-yt-paper-icon-button
                tabindex="0"
                icon="yt-icons:settings"
                class="ytmd-settings-plugin-action-icon"
              />
            </Match>
          </Switch>
          <div
            class={`toggle-switch ${plugin.config?.enabled ? 'active' : ''}`}
            onClick={togglePlugin}
          />
        </div>
      </div>
    </div>
  );
};
