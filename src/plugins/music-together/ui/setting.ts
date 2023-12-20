import { Popup } from '@/plugins/music-together/element';
import { ElementFromHtml } from '@/plugins/utils/renderer';

import IconMusicCast from '../icons/music-cast.svg?raw';
import IconConnect from '../icons/connect.svg?raw';
import { createStatus } from './status';

export type SettingPopupProps = {
  onItemClick: (id: string) => void;
};
export const createSettingPopup = (props: SettingPopupProps): ReturnType<typeof Popup> => {
  const status = createStatus();
  status.setStatus('disconnected');

  const result = Popup({
    data: [
      {
        type: 'custom',
        element: status.element,
      },
      {
        type: 'divider',
      },
      {
        id: 'music-together-host',
        type: 'item',
        icon: ElementFromHtml(IconMusicCast),
        text: 'Host Music Together',
        onClick: () => props.onItemClick('music-together-host'),
      },
      {
        type: 'item',
        icon: ElementFromHtml(IconConnect),
        text: 'Join Music Together',
        onClick: () => props.onItemClick('music-together-join'),
      },
    ],
    anchorAt: 'bottom-right',
    popupAt: 'top-right'
  });

  return {
    ...status,
    ...result,
  };
}
