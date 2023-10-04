import { ipcRenderer, Menu } from 'electron';

import { createPanel } from './menu/panel';

import logo from '../../assets/youtube-music.svg';
import { isEnabled } from '../../config/plugins';

function $<E extends Element = Element>(selector: string) {
  return document.querySelector<E>(selector);
}

const isMacOS = navigator.userAgent.includes('Macintosh');

export default () => {
  const titleBar = document.createElement('title-bar');
  const navBar = document.querySelector<HTMLDivElement>('#nav-bar-background');
  if (isMacOS) titleBar.style.setProperty('--offset-left', '70px');

  logo.classList.add('title-bar-icon');

  if (!isMacOS) titleBar.appendChild(logo);
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
    const htmlHeadStyle = $('head > div > style');
    if (htmlHeadStyle) {
      // HACK: This is a hack to remove the scrollbar width
      htmlHeadStyle.innerHTML = htmlHeadStyle.innerHTML.replace('html::-webkit-scrollbar {width: var(--ytmusic-scrollbar-width);', 'html::-webkit-scrollbar {');
    }
  }, { once: true, passive: true });
};
