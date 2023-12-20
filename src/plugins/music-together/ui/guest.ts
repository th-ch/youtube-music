import { ElementFromHtml } from '@/plugins/utils/renderer';

import { Popup } from '../element';
import { createStatus } from '../ui/status';

import IconOff from '../icons/off.svg?raw';


export type GuestPopupProps = {
  onItemClick: (id: string) => void;
};
export const createGuestPopup = (props: GuestPopupProps) => {
  const status = createStatus();
  status.setStatus('guest');

  return Popup({
    data: [
      {
        type: 'custom',
        element: status.element,
      },
      {
        type: 'divider',
      },
      {
        type: 'item',
        id: 'music-together-disconnect',
        icon: ElementFromHtml(IconOff),
        text: 'Disconnect Music Together',
        onClick: () => props.onItemClick('music-together-disconnect'),
      },
    ],
    anchorAt: 'bottom-right',
    popupAt: 'top-right'
  });
}
