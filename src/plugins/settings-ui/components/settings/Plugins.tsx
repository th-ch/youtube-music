import { createSignal, For, Show } from 'solid-js';
import { allPlugins } from 'virtual:plugins';
import { plugins } from '../../renderer';
// import config from '@/config';

interface PluginCardProps {
  id: string;
  label: string;
  description: string;
  authors?: string[];
}

const PluginCard = (props: PluginCardProps) => {
  const [enabled, setEnabled] = createSignal<boolean | null>(null);
  plugins.isEnabled(props.id).then(setEnabled);

  const toggle = () => {
    const state = enabled();

    if (state === null) return;
    if (state) {
      plugins.disable(props.id);
      setEnabled(false);
    } else {
      plugins.enable(props.id);
      setEnabled(true);
    }
  };

  return (
    <div class="ytmd-sui-settingItem">
      <div class="ytmd-sui-pluginHeader">
        <div>
          <h4>{props.label}</h4>
          <Show when={Array.isArray(props.authors) && props.authors.length > 0}>
            <span class="ytmd-sui-pluginAuthor">
              by {props.authors!.join(', ')}
            </span>
          </Show>
        </div>
        <div
          class={`ytmd-sui-toggle ${enabled() ? 'active' : ''}`}
          tabIndex={1}
          onClick={toggle}
          onKeyUp={(e) => {
            e.preventDefault();
            if (e.key === 'Enter' || e.key === ' ') {
              toggle();
            }
          }}
        >
          <div class="ytmd-sui-toggleHandle"></div>
        </div>
      </div>
      <p class="ytmd-sui-pluginDescription">{props.description}</p>
    </div>
  );
};

export default () => {
  const availablePlugins = Object.keys(allPlugins);

  return (
    <div class="ytmd-sui-settingsContent ytmd-sui-pluginsSection">
      <For each={availablePlugins}>
        {(pluginId) => {
          const plugin = allPlugins[pluginId];
          return (
            <PluginCard
              id={pluginId}
              label={plugin.name()}
              description={plugin.description?.() ?? 'N/A'}
              authors={plugin.authors}
            />
          );
        }}
      </For>
    </div>
  );
};
