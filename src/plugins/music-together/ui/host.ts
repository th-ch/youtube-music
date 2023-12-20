import { Popup } from '@/plugins/music-together/element';
import { ElementFromHtml } from '@/plugins/utils/renderer';

import IconKey from '../icons/key.svg?raw';
import IconOff from '../icons/off.svg?raw';
import { createStatus } from '@/plugins/music-together/ui/status';
import { t } from '@/i18n';

export type HostPopupProps = {
  onItemClick: (id: string) => void;
};
export const createHostPopup = (props: HostPopupProps) => {
  const status = createStatus();
  status.setStatus('host');

  const result = Popup({
    data: [
      {
        type: 'custom',
        element: status.element,
      },
      {
        type: 'divider'
      },
      {
        id: 'music-together-copy-id',
        type: 'item',
        icon: ElementFromHtml(IconKey),
        text: t('plugins.music-together.menu.click-to-copy-id'),
        onClick: () => props.onItemClick('music-together-copy-id'),
      },
      {
        type: 'divider',
      },
      {
        type: 'item',
        id: 'music-together-close',
        icon: ElementFromHtml(IconOff),
        text: t('plugins.music-together.menu.close'),
        onClick: () => props.onItemClick('music-together-close'),
      },
    ],
    anchorAt: 'bottom-right',
    popupAt: 'top-right',
  });

  return {
    ...status,
    ...result,
  };
};
