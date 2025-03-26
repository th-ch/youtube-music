import { createEffect, createSignal, For, Show } from 'solid-js';
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

// prettier-ignore
export default () => {
  const availablePlugins = Object.keys(allPlugins);

  const [query, setQuery] = createSignal('');
  const [filter, setFilter] = createSignal<'all' | 'enabled' | 'disabled'>('all');
  const [filteredPlugins, setFilteredPlugins] = createSignal<string[]>(availablePlugins);

  createEffect(() => {
    if (filter() === 'all') {
      setFilteredPlugins(Array.from(availablePlugins));
      return;
    }

    (async () => {
      const filtered: string[] = [];

      for (const plugin of availablePlugins) {
        const enabled = await plugins.isEnabled(plugin);

        if (filter() === 'enabled' && enabled) {
          filtered.push(plugin);
        } else if (filter() === 'disabled' && !enabled) {
          filtered.push(plugin);
        }
      }

      // TODO: Add search functionality

      setFilteredPlugins(filtered);
    })();
  });

  return (
    <div class="ytmd-sui-settingsContent">
      <div class="ytmd-sui-pluginsFilters">
        <div class="ytmd-sui-pluginsSearch">
          <input
            type="text"
            class="ytmd-sui-input"
            onInput={(e) => setQuery(e.currentTarget.value)}
            placeholder="Search plugins..."
          />
        </div>
        <div class="ytmd-sui-settingText">
          <div class="ytmd-sui-settingLabel">
            <span class="ytmd-sui-settingTitle">Show</span>
          </div>
          <select
            class="ytmd-sui-select"
            tabIndex={1}
            value="all"
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>
      <div class="ytmd-sui-pluginsSection">
        <For each={filteredPlugins()}>
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
    </div>
  );
};
