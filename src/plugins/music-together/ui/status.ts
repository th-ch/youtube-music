import { ElementFromHtml } from '@/plugins/utils/renderer';
import statusHTML from '../templates/status.html?raw';
import { t } from '@/i18n';

type Profile = {
  id: string;
  name: string;
  thumbnail?: string;
};
export const createStatus = () => {
  const element = ElementFromHtml(statusHTML);
  const icon = document.querySelector<HTMLImageElement>('ytmusic-settings-button > tp-yt-paper-icon-button > tp-yt-iron-icon#icon img');

  const profile = element.querySelector<HTMLImageElement>('.music-together-profile')!;
  const label = element.querySelector<HTMLDivElement>('#music-together-status-label')!;

  profile.src = icon?.src ?? '';

  const setStatus = (status: 'disconnected' | 'host' | 'guest') => {
    if (status === 'disconnected') {
      label.textContent = t('plugins.music-together.menu.status.disconnected');
      label.style.color = 'rgba(255, 255, 255, 0.5)';
    }

    if (status === 'host') {
      label.textContent = t('plugins.music-together.menu.status.host');
      label.style.color = 'rgba(255, 0, 0, 1)';
    }

    if (status === 'guest') {
      label.textContent = t('plugins.music-together.menu.status.guest');
      label.style.color = 'rgba(255, 255, 255, 1)';
    }
  };

  const setProfile = (src: string) => {
    profile.src = src;
  };

  const setUsers = (users: Profile[]) => {
    const container = element.querySelector<HTMLDivElement>('.music-together-user-container')!;
    const empty = document.querySelector<HTMLElement>('.music-together-empty')!;
    for (const child of container.children) {
      if (child !== empty) child.remove();
    }

    if (users.length === 0) empty.style.display = 'block';
    else empty.style.display = 'none';

    for (const user of users) {
      const img = document.createElement('img');
      img.classList.add('music-together-profile');
      img.src = user.thumbnail ?? '';
      img.title = user.name;
      img.alt = `${user.name} (${user.id})`;

      container.append(img);
    }
  };

  return {
    element,
    setStatus,
    setUsers,
    setProfile,
  };
};
