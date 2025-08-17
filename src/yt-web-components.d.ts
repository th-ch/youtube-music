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

    interface YtmdTransProps {
      key?: string;
    }

    interface IntrinsicElements extends MDUIElements {
      'center': ComponentProps<'div'>;
      'yt-formatted-string': ComponentProps<'span'> & YtFormattedStringProps;
      'yt-button-renderer': ComponentProps<'button'> & YtButtonRendererProps;
      'tp-yt-paper-spinner-lite': ComponentProps<'div'> &
        YpYtPaperSpinnerLiteProps;

      'tp-yt-paper-icon-button': ComponentProps<'div'> &
        TpYtPaperIconButtonProps;
      'yt-icon-button': ComponentProps<'div'> & TpYtPaperIconButtonProps;
      'yt-icon': ComponentProps<'div'> & TpYtPaperIconButtonProps;
      'center': ComponentProps<'div'>;
      'ytmd-trans': ComponentProps<'span'> & YtmdTransProps;
      'yt-formatted-string': ComponentProps<'span'> & YtFormattedStringProps;
      'yt-button-renderer': ComponentProps<'button'> & YtButtonRendererProps;
      'yt-touch-feedback-shape': ComponentProps<'div'>;

      'tp-yt-iron-icon': ComponentProps<'div'>;
      // input type="range" slider component
      'tp-yt-paper-slider': ComponentProps<'input'> & {
        'value'?: number | string;
        'min'?: number | string;
        'max'?: number | string;
        'step'?: number | string;
        'disabled'?: boolean;
        'on:immediate-value-changed'?: (
          event: CustomEvent<{ value: number }>,
        ) => void;
      };
      'tp-yt-paper-progress': ComponentProps<'input'>;
    }
  }
}
