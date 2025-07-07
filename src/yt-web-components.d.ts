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

    interface YtmdTransProps {
      key?: string;
    }

    interface IntrinsicElements {
      center: ComponentProps<'div'>;
      'ytmd-trans': ComponentProps<'span'> & YtmdTransProps;
      'yt-formatted-string': ComponentProps<'span'> & YtFormattedStringProps;
      'yt-button-renderer': ComponentProps<'button'> & YtButtonRendererProps;
      'tp-yt-paper-spinner-lite': ComponentProps<'div'> &
        YpYtPaperSpinnerLiteProps;
      'tp-yt-paper-icon-button': ComponentProps<'div'> &
        TpYtPaperIconButtonProps;
      'yt-icon-button': ComponentProps<'div'> & TpYtPaperIconButtonProps;
      'tp-yt-iron-icon': ComponentProps<'div'>;
      'yt-icon': ComponentProps<'div'>;
    }
  }
}
