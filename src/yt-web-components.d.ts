import { Icons } from '@/types/icons';

import type { ComponentProps } from 'solid-js';
import { type IntrinsicElements as MDUIElements } from 'mdui/jsx.en';

declare module 'solid-js' {
  namespace JSX {
    interface YtFormattedStringProps {
      text?: {
        runs: { text: string }[];
      };
      data?: object;
      disabled?: boolean;
      hidden?: boolean;
    }

    interface YtButtonRendererProps {
      data?: {
        icon?: {
          iconType: string;
        };
        isDisabled?: boolean;
        style?: string;
        text?: {
          simpleText: string;
        };
      };
    }

    interface YpYtPaperSpinnerLiteProps {
      active?: boolean;
    }

    interface TpYtPaperIconButtonProps {
      icon: Icons;
    }

    interface IntrinsicElements extends MDUIElements {
      'center': ComponentProps<'div'>;
      'yt-formatted-string': ComponentProps<'span'> & YtFormattedStringProps;
      'yt-button-renderer': ComponentProps<'button'> & YtButtonRendererProps;
      'tp-yt-paper-spinner-lite': ComponentProps<'div'> &
        YpYtPaperSpinnerLiteProps;
      'tp-yt-paper-icon-button': ComponentProps<'div'> &
        TpYtPaperIconButtonProps;
    }
  }
}
