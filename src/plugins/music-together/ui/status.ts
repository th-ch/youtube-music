import { ElementFromHtml } from '@/plugins/utils/renderer';
import statusHTML from '../templates/status.html?raw';

export const createStatus = () => {
  const element = ElementFromHtml(statusHTML);
  const icon = document.querySelector<HTMLImageElement>('ytmusic-settings-button > tp-yt-paper-icon-button > tp-yt-iron-icon#icon img');

  const profile = element.querySelector<HTMLImageElement>('.music-together-profile')!;
  const label = element.querySelector<HTMLDivElement>('#music-together-status-label')!;

  profile.src = icon?.src ?? '';

  const setStatus = (status: 'disconnected' | 'host' | 'guest') => {
    if (status === 'disconnected') {
      label.textContent = status;
      label.style.color = 'rgba(255, 255, 255, 0.5)';
    }

    if (status === 'host') {
      label.textContent = 'Host';
      label.style.color = 'rgba(255, 0, 0, 1)';
    }

    if (status === 'guest') {
      label.textContent = 'Guest';
      label.style.color = 'rgba(255, 255, 255, 1)';
    }
  };

  return {
    element,
    setStatus,
  };
};
