import path from 'node:path';

import { ipcRenderer, Menu } from 'electron';

import { createPanel } from './menu/panel';

import { ElementFromFile } from '../utils';
import { isEnabled } from '../../config/plugins';

type ElectronCSSStyleDeclaration = CSSStyleDeclaration & { webkitAppRegion: 'drag' | 'no-drag' };
type ElectronHTMLElement = HTMLElement & { style: ElectronCSSStyleDeclaration };

function $<E extends Element = Element>(selector: string) {
  return document.querySelector<E>(selector);
}

export default () => {
  const titleBar = document.createElement('title-bar');
  const navBar = document.querySelector<HTMLDivElement>('#nav-bar-background');

  const logo = ElementFromFile(path.join(__dirname, '..' , '..' , 'assets', 'youtube-music.svg'));
  logo.classList.add('title-bar-icon');

  titleBar.appendChild(logo);
  document.body.appendChild(titleBar);

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

    const menu = await ipcRenderer.invoke('get-menu') as Menu | null;
    if (!menu) return;

    menu.items.forEach((menuItem) => {
      const menu = document.createElement('menu-button');
      createPanel(titleBar, menu, menuItem.submenu?.items ?? []);

      menu.append(menuItem.label);
      titleBar.appendChild(menu);
    });
  };
  updateMenu();

  document.title = 'Youtube Music';

  ipcRenderer.on('refreshMenu', () => {
    updateMenu();
  });

  if (isEnabled('picture-in-picture')) {
    ipcRenderer.on('pip-toggle', () => {
      updateMenu();
    });
  }

  // Increases the right margin of Navbar background when the scrollbar is visible to avoid blocking it (z-index doesn't affect it)
  document.addEventListener('apiLoaded', () => {
    setupSearchOpenObserver();
    const htmlHeadStyle = $('head > div > style');
    if (htmlHeadStyle) {
      // HACK: This is a hack to remove the scrollbar width
      htmlHeadStyle.innerHTML = htmlHeadStyle.innerHTML.replace('html::-webkit-scrollbar {width: var(--ytmusic-scrollbar-width);', 'html::-webkit-scrollbar {');
    }
  }, { once: true, passive: true });
};

function setupSearchOpenObserver() {
  const searchOpenObserver = new MutationObserver((mutations) => {
    const navBarBackground = $<ElectronHTMLElement>('#nav-bar-background');
    if (navBarBackground) {
      navBarBackground.style.webkitAppRegion = (mutations[0].target as HTMLElement & { opened: boolean }).opened ? 'no-drag' : 'drag';
    }
  });
  const searchBox = $('ytmusic-search-box');
  if (searchBox) {
    searchOpenObserver.observe(searchBox, { attributeFilter: ['opened'] });
  }
}
