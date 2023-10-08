import { nativeImage, type MenuItem, ipcRenderer, Menu } from 'electron';

import Icons from './icons';

import { ElementFromHtml } from '../../utils';

interface PanelOptions {
  placement?: 'bottom' | 'right';
  order?: number;
}

export const createPanel = (
  parent: HTMLElement,
  anchor: HTMLElement,
  items: MenuItem[],
  options: PanelOptions = { placement: 'bottom', order: 0 },
) => {
  const childPanels: HTMLElement[] = [];
  const panel = document.createElement('menu-panel');
  panel.style.zIndex = `${options.order}`;

  const updateIconState = (iconWrapper: HTMLElement, item: MenuItem) => {
    if (item.type === 'checkbox') {
      if (item.checked) iconWrapper.innerHTML = Icons.checkbox;
      else iconWrapper.innerHTML = '';
    } else if (item.type === 'radio') {
      if (item.checked) iconWrapper.innerHTML = Icons.radio.checked;
      else iconWrapper.innerHTML = Icons.radio.unchecked;
    } else {
      const nativeImageIcon = typeof item.icon === 'string' ? nativeImage.createFromPath(item.icon) : item.icon;
      const iconURL = nativeImageIcon?.toDataURL();

      if (iconURL) iconWrapper.style.background = `url(${iconURL})`;
    }
  };

  const radioGroups: [MenuItem, HTMLElement][] = [];
  items.map((item) => {
    if (item.type === 'separator') return panel.appendChild(document.createElement('menu-separator'));

    const menu = document.createElement('menu-item');
    const iconWrapper = document.createElement('menu-icon');

    updateIconState(iconWrapper, item);
    menu.appendChild(iconWrapper);
    menu.append(item.label);

    menu.addEventListener('click', async () => {
      await ipcRenderer.invoke('menu-event', item.commandId);
      const menuItem = await ipcRenderer.invoke('get-menu-by-id', item.commandId) as MenuItem | null;

      if (menuItem) {
        updateIconState(iconWrapper, menuItem);

        if (menuItem.type === 'radio') {
          await Promise.all(
            radioGroups.map(async ([item, iconWrapper]) => {
              if (item.commandId === menuItem.commandId) return;
              const newItem = await ipcRenderer.invoke('get-menu-by-id', item.commandId) as MenuItem | null;

              if (newItem) updateIconState(iconWrapper, newItem);
            })
          );
        }
      }
    });

    if (item.type === 'radio') {
      radioGroups.push([item, iconWrapper]);
    }

    if (item.type === 'submenu') {
      const subMenuIcon = document.createElement('menu-icon');
      subMenuIcon.appendChild(ElementFromHtml(Icons.submenu));
      menu.appendChild(subMenuIcon);

      const [child, , children] = createPanel(parent, menu, item.submenu?.items ?? [], {
        placement: 'right',
        order: (options?.order ?? 0) + 1,
      });

      childPanels.push(child);
      children.push(...children);
    }

    panel.appendChild(menu);
  });

  /* methods */
  const isOpened = () => panel.getAttribute('open') === 'true';
  const close = () => panel.setAttribute('open', 'false');
  const open = () => {
    const rect = anchor.getBoundingClientRect();

    if (options.placement === 'bottom') {
      panel.style.setProperty('--x', `${rect.x}px`);
      panel.style.setProperty('--y', `${rect.y + rect.height}px`);
    } else {
      panel.style.setProperty('--x', `${rect.x + rect.width}px`);
      panel.style.setProperty('--y', `${rect.y}px`);
    }

    panel.setAttribute('open', 'true');

    // Children are placed below their parent item, which can cause
    // long lists to squeeze their children at the bottom of the screen
    // (This needs to be done *after* setAttribute)
    panel.classList.remove('position-by-bottom');
    if (options.placement === 'right' && panel.scrollHeight > panel.clientHeight ) {
      panel.style.setProperty('--y', `${rect.y + rect.height}px`);
      panel.classList.add('position-by-bottom');
    }
  };

  anchor.addEventListener('click', () => {
    if (isOpened()) close();
    else open();
  });

  document.body.addEventListener('click', (event) => {
    const path = event.composedPath();
    const isInside = path.some((it) => it === panel || it === anchor || childPanels.includes(it as HTMLElement));

    if (!isInside) close();
  });

  parent.appendChild(panel);

  return [
    panel,
    { isOpened, close, open },
    childPanels,
  ] as const;
};
