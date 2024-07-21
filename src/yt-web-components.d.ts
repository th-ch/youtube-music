import type { ComponentProps } from 'solid-js';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'yt-formatted-string': ComponentProps<'span'>;
    }
  }
}
