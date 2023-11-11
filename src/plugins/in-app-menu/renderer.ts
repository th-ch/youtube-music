import { createPanel } from './menu/panel';

import logoRaw from './assets/menu.svg?inline';
import closeRaw from './assets/close.svg?inline';
import minimizeRaw from './assets/minimize.svg?inline';
import maximizeRaw from './assets/maximize.svg?inline';
import unmaximizeRaw from './assets/unmaximize.svg?inline';

import builder from './index';

import type { Menu } from 'electron';

const isMacOS = navigator.userAgent.includes('Macintosh');
const isNotWindowsOrMacOS = !navigator.userAgent.includes('Windows') && !isMacOS;

export default builder.createRenderer(({ getConfig, invoke, on }) => {
  return {
    async onLoad() {
      const config = await getConfig();

      const hideDOMWindowControls = config.hideDOMWindowControls;

      let hideMenu = window.mainConfig.get('options.hideMenu');
      const titleBar = document.createElement('title-bar');
      const navBar = document.querySelector<HTMLDivElement>('#nav-bar-background');
      let maximizeButton: HTMLButtonElement;
      let panelClosers: (() => void)[] = [];
      if (isMacOS) titleBar.style.setProperty('--offset-left', '70px');

      const logo = document.createElement('img');
      const close = document.createElement('img');
      const minimize = document.createElement('img');
      const maximize = document.createElement('img');
      const unmaximize = document.createElement('img');

      if (window.ELECTRON_RENDERER_URL) {
        logo.src = window.ELECTRON_RENDERER_URL + '/' + logoRaw;
        close.src = window.ELECTRON_RENDERER_URL + '/' + closeRaw;
        minimize.src = window.ELECTRON_RENDERER_URL + '/' + minimizeRaw;
        maximize.src = window.ELECTRON_RENDERER_URL + '/' + maximizeRaw;
        unmaximize.src = window.ELECTRON_RENDERER_URL + '/' + unmaximizeRaw;
      } else {
        logo.src = logoRaw;
        close.src = closeRaw;
        minimize.src = minimizeRaw;
        maximize.src = maximizeRaw;
        unmaximize.src = unmaximizeRaw;
      }

      logo.classList.add('title-bar-icon');
      const logoClick = () => {
        hideMenu = !hideMenu;
        let visibilityStyle: string;
        if (hideMenu) {
          visibilityStyle = 'hidden';
        } else {
          visibilityStyle = 'visible';
        }
        const menus = document.querySelectorAll<HTMLElement>('menu-button');
        menus.forEach((menu) => {
          menu.style.visibility = visibilityStyle;
        });
      };
      logo.onclick = logoClick;

      on('toggle-in-app-menu', logoClick);

      if (!isMacOS) titleBar.appendChild(logo);
      document.body.appendChild(titleBar);

      titleBar.appendChild(logo);

      const addWindowControls = async () => {

        // Create window control buttons
        const minimizeButton = document.createElement('button');
        minimizeButton.classList.add('window-control');
        minimizeButton.appendChild(minimize);
        minimizeButton.onclick = () => invoke('window-minimize');

        maximizeButton = document.createElement('button');
        if (await invoke('window-is-maximized')) {
          maximizeButton.classList.add('window-control');
          maximizeButton.appendChild(unmaximize);
        } else {
          maximizeButton.classList.add('window-control');
          maximizeButton.appendChild(maximize);
        }
        maximizeButton.onclick = async () => {
          if (await invoke('window-is-maximized')) {
            // change icon to maximize
            maximizeButton.removeChild(maximizeButton.firstChild!);
            maximizeButton.appendChild(maximize);

            // call unmaximize
            await invoke('window-unmaximize');
          } else {
            // change icon to unmaximize
            maximizeButton.removeChild(maximizeButton.firstChild!);
            maximizeButton.appendChild(unmaximize);

            // call maximize
            await invoke('window-maximize');
          }
        };

        const closeButton = document.createElement('button');
        closeButton.classList.add('window-control');
        closeButton.appendChild(close);
        closeButton.onclick = () => invoke('window-close');

        // Create a container div for the window control buttons
        const windowControlsContainer = document.createElement('div');
        windowControlsContainer.classList.add('window-controls-container');
        windowControlsContainer.appendChild(minimizeButton);
        windowControlsContainer.appendChild(maximizeButton);
        windowControlsContainer.appendChild(closeButton);

        // Add window control buttons to the title bar
        titleBar.appendChild(windowControlsContainer);
      };

      if (isNotWindowsOrMacOS && !hideDOMWindowControls) await addWindowControls();

      if (navBar) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach(() => {
            titleBar.style.setProperty('--titlebar-background-color', navBar.style.backgroundColor);
            document.querySelector('html')!.style.setProperty('--titlebar-background-color', navBar.style.backgroundColor);
          });
        });

        observer.observe(navBar, { attributes : true, attributeFilter : ['style'] });
      }

      const updateMenu = async () => {
        const children = [...titleBar.children];
        children.forEach((child) => {
          if (child !== logo) child.remove();
        });
        panelClosers = [];

        const menu = await invoke<Menu | null>('get-menu');
        if (!menu) return;

        menu.items.forEach((menuItem) => {
          const menu = document.createElement('menu-button');
          const [, { close: closer }] = createPanel(titleBar, menu, menuItem.submenu?.items ?? []);
          panelClosers.push(closer);

          menu.append(menuItem.label);
          titleBar.appendChild(menu);
          if (hideMenu) {
            menu.style.visibility = 'hidden';
          }
        });
        if (isNotWindowsOrMacOS && !hideDOMWindowControls) await addWindowControls();
      };
      await updateMenu();

      document.title = 'Youtube Music';

      on('close-all-in-app-menu-panel', () => {
        panelClosers.forEach((closer) => closer());
      });
      on('refresh-in-app-menu', () => updateMenu());
      on('window-maximize', () => {
        if (isNotWindowsOrMacOS && !hideDOMWindowControls && maximizeButton.firstChild) {
          maximizeButton.removeChild(maximizeButton.firstChild);
          maximizeButton.appendChild(unmaximize);
        }
      });
      on('window-unmaximize', () => {
        if (isNotWindowsOrMacOS && !hideDOMWindowControls && maximizeButton.firstChild) {
          maximizeButton.removeChild(maximizeButton.firstChild);
          maximizeButton.appendChild(unmaximize);
        }
      });

      if (window.mainConfig.plugins.isEnabled('picture-in-picture')) {
        on('pip-toggle', () => {
          updateMenu();
        });
      }
    },
    // Increases the right margin of Navbar background when the scrollbar is visible to avoid blocking it (z-index doesn't affect it)
    onPlayerApiReady() {
      const htmlHeadStyle = document.querySelector('head > div > style');
      if (htmlHeadStyle) {
        // HACK: This is a hack to remove the scrollbar width
        htmlHeadStyle.innerHTML = htmlHeadStyle.innerHTML.replace('html::-webkit-scrollbar {width: var(--ytmusic-scrollbar-width);', 'html::-webkit-scrollbar {');
      }
    },
  };
});
