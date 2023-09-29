import { ipcRenderer, Menu } from 'electron';
// eslint-disable-next-line import/no-unresolved
import { Color, Titlebar } from 'custom-electron-titlebar';

import config from '../../config';
import { isEnabled } from '../../config/plugins';

import type { FastAverageColorResult } from 'fast-average-color';

type ElectronCSSStyleDeclaration = CSSStyleDeclaration & { webkitAppRegion: 'drag' | 'no-drag' };
type ElectronHTMLElement = HTMLElement & { style: ElectronCSSStyleDeclaration };

function $<E extends Element = Element>(selector: string) {
  return document.querySelector<E>(selector);
}

export default () => {
  const visible = () => !!($('.cet-menubar')?.firstChild);
  const bar = new Titlebar({
    icon: 'https://cdn-icons-png.flaticon.com/512/5358/5358672.png',
    backgroundColor: Color.fromHex('#050505'),
    itemBackgroundColor: Color.fromHex('#1d1d1d') ,
    svgColor: Color.WHITE,
    menu: config.get('options.hideMenu') ? null as unknown as Menu : undefined,
  });
  bar.updateTitle(' ');
  document.title = 'Youtube Music';

  const toggleMenu = () => {
    if (visible()) {
      bar.updateMenu(null as unknown as Menu);
    } else {
      bar.refreshMenu();
    }
  };

  $('.cet-window-icon')?.addEventListener('click', toggleMenu);
  ipcRenderer.on('toggleMenu', toggleMenu);

  ipcRenderer.on('refreshMenu', () => {
    if (visible()) {
      bar.refreshMenu();
    }
  });

  if (isEnabled('album-color-theme')) {
    ipcRenderer.on('album-color-changed', (_, albumColor: FastAverageColorResult) => {
      if (albumColor) {
        bar.updateBackground(Color.fromHex(albumColor.hexa));
      } else {
        bar.updateBackground(Color.fromHex('#050505'));
      }
    });
  }

  if (isEnabled('picture-in-picture')) {
    ipcRenderer.on('pip-toggle', () => {
      bar.refreshMenu();
    });
  }

  // Increases the right margin of Navbar background when the scrollbar is visible to avoid blocking it (z-index doesn't affect it)
  document.addEventListener('apiLoaded', () => {
    setNavbarMargin();
    const playPageObserver = new MutationObserver(setNavbarMargin);
    const appLayout = $('ytmusic-app-layout');
    if (appLayout) {
      playPageObserver.observe(appLayout, { attributeFilter: ['player-page-open_', 'playerPageOpen_'] });
    }
    setupSearchOpenObserver();
    setupMenuOpenObserver();
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

function setupMenuOpenObserver() {
  const cetMenubar = $('.cet-menubar');
  if (cetMenubar) {
    const menuOpenObserver = new MutationObserver(() => {
      let isOpen = false;
      for (const child of cetMenubar.children) {
        if (child.classList.contains('open')) {
          isOpen = true;
          break;
        }
      }
      const navBarBackground = $<ElectronHTMLElement>('#nav-bar-background');
      if (navBarBackground) {
        navBarBackground.style.webkitAppRegion = isOpen ? 'no-drag' : 'drag';
      }
    });
    menuOpenObserver.observe(cetMenubar, { subtree: true, attributeFilter: ['class'] });
  }
}

function setNavbarMargin() {
  const navBarBackground = $<HTMLElement>('#nav-bar-background');
  if (navBarBackground) {
    navBarBackground.style.right
      = $<HTMLElement & { playerPageOpen_: boolean }>('ytmusic-app-layout')?.playerPageOpen_
      ? '0px'
      : '12px';
  }
}
