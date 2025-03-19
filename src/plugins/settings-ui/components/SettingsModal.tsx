import {
  createSignal,
  Switch,
  Match,
  For,
  createEffect,
  onCleanup,
} from 'solid-js';

import General from './settings/General';
import Appearance from './settings/Appearance';
import Plugins from './settings/Plugins';
import Advanced from './settings/Advanced';
import About from './settings/About';

interface SettingsModalProps {
  close: () => void;
}

export default ({ close }: SettingsModalProps) => {
  const [currentCategory, setCurrentCategory] = createSignal('general');
  const [isSidebarExpanded, setIsSidebarExpanded] = createSignal(true);

  createEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 908;
      if (isMobile) {
        setIsSidebarExpanded(false);
      }
    };

    // initial call
    handleResize();

    window.addEventListener('resize', handleResize);
    onCleanup(() => window.removeEventListener('resize', handleResize));
  });

  const menuItems = [
    { icon: '⚙️', label: 'General', id: 'general' },
    { icon: '🎨', label: 'Appearance', id: 'appearance' },
    { icon: '🔌', label: 'Plugins', id: 'plugins' },
    { icon: '🛠️', label: 'Advanced', id: 'advanced' },
    { icon: 'ℹ️', label: 'About', id: 'about' },
  ];

  return (
    <>
      <div class="ytmd-sui-modalOverlay">
        <div class="ytmd-sui-modal">
          <div
            class={`ytmd-sui-sidebar ${
              !isSidebarExpanded() ? 'collapsed' : ''
            }`}
          >
            <div class="ytmd-sui-sidebarContent">
              <For each={menuItems}>
                {(item) => (
                  <button
                    class={`ytmd-sui-menuItem ${
                      currentCategory() === item.id ? 'active' : ''
                    }`}
                    onClick={() => setCurrentCategory(item.id)}
                    title={!isSidebarExpanded() ? item.label : undefined}
                  >
                    <span class="ytmd-sui-icon">{item.icon}</span>
                    <span class="ytmd-sui-menuLabel">{item.label}</span>
                  </button>
                )}
              </For>
            </div>
            <button
              class="ytmd-sui-sidebarToggle"
              onClick={() => setIsSidebarExpanded((old) => !old)}
              title={isSidebarExpanded() ? 'Collapse menu' : 'Expand menu'}
            >
              ☰
            </button>
          </div>

          <div class="ytmd-sui-content">
            <div class="ytmd-sui-header">
              <h2>
                {menuItems.find((item) => item.id === currentCategory())?.label}
              </h2>
              <button class="ytmd-sui-closeButton" onClick={close}>
                ✕
              </button>
            </div>

            <Switch fallback={<General />}>
              <Match when={currentCategory() === 'general'}>
                <General />
              </Match>
              <Match when={currentCategory() === 'appearance'}>
                <Appearance />
              </Match>
              <Match when={currentCategory() === 'plugins'}>
                <Plugins />
              </Match>
              <Match when={currentCategory() === 'advanced'}>
                <Advanced />
              </Match>
              <Match when={currentCategory() === 'about'}>
                <About />
              </Match>
            </Switch>
          </div>
        </div>
      </div>
    </>
  );
};
