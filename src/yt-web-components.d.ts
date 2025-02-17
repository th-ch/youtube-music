import { Icons } from '@/types/icons';

import type { ComponentProps } from 'solid-js';

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

    interface IntrinsicElements {
      center: ComponentProps<'div'>;
      'yt-formatted-string': ComponentProps<'span'> & YtFormattedStringProps;
      'yt-button-renderer': ComponentProps<'button'> & YtButtonRendererProps;
      'tp-yt-paper-spinner-lite': ComponentProps<'div'> &
        YpYtPaperSpinnerLiteProps;
      'tp-yt-paper-icon-button': ComponentProps<'div'> &
        TpYtPaperIconButtonProps;
      'tp-yt-paper-listbox': ComponentProps<'div'>;

      // Non-ytmusic elements
      'ytmd-trans': ComponentProps<'span'> & {
        key: string;
      } & {
        [key: `attr:${strig}`]: unknown;
      };

      // fallback
      'marquee': ComponentProps<'marquee'>;
    }
  }
}
