import { render } from 'solid-js/web';

import { MusicTogetherButton } from './Button';

import { AppElement } from '@/types/queue';
import { RendererContext } from '@/types/contexts';
import { MusicTogetherConfig } from '@/plugins/music-together/types';

import { ToastProvider } from '../context/ToastContext';
import { RendererContextProvider } from '../context/RendererContext';

import { setUser } from '../store/user';

export const onRendererLoad = (
  context: RendererContext<MusicTogetherConfig>,
) => {
  const container = document.createElement('div');
  const target = document.querySelector<HTMLElement>(
    '#right-content > ytmusic-settings-button',
  );
  const api = document.querySelector<AppElement>('ytmusic-app');

  if (!target) {
    console.warn('Music Together [renderer]: Cannot inject a button');
    return;
  }

  const button = target.querySelector<HTMLElement>('tp-yt-paper-icon-button');
  button?.click();

  const interval = setInterval(() => {
    const thumbnail = target?.querySelector<HTMLImageElement>('img')?.src;
    const name = document.querySelector('#account-name')?.textContent;

    if (name) {
      setUser({ name, thumbnail });

      clearInterval(interval);
      setTimeout(() => {
        button?.click();

        target?.insertAdjacentElement('beforebegin', container);
        render(
          () => (
            <RendererContextProvider context={context}>
              <ToastProvider service={api!.toastService}>
                <MusicTogetherButton />
              </ToastProvider>
            </RendererContextProvider>
          ),
          container,
        );
      }, 0);
    }
  }, 1);
};
