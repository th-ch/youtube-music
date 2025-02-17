import { createSignal, Show } from 'solid-js';
import { css } from 'solid-styled-components';

import { useFloating } from 'solid-floating-ui';

import { autoUpdate, flip, offset } from '@floating-ui/dom';

import { Portal } from 'solid-js/web';

import { cacheNoArgs } from '@/providers/decorators';
import { MusicTogetherPanel } from '@/plugins/music-together/src/Panel';

const buttonStyle = cacheNoArgs(
  () => css`
    display: inline-flex;

    cursor: pointer;
    margin-left: 8px;
    margin-right: 16px;

    & svg {
      width: 24px;
      height: 24px;
      fill: rgba(255, 255, 255, 0.5);
    }

    &:hover svg:hover {
      fill: #fff;
    }
  `,
);

const popupStyle = cacheNoArgs(
  () => css`
    position: fixed;
    top: var(--offset-y, 0);
    left: var(--offset-x, 0);

    z-index: 1000;
  `,
);

export const MusicTogetherButton = () => {
  const [enabled, setEnabled] = createSignal(false);

  const [anchor, setAnchor] = createSignal<HTMLElement | null>(null);
  const [panel, setPanel] = createSignal<HTMLElement | null>(null);

  const position = useFloating(anchor, panel, {
    whileElementsMounted: autoUpdate,
    strategy: 'fixed',
    placement: 'bottom-end',
    middleware: [
      offset({
        mainAxis: 4,
        crossAxis: 0,
      }),
      flip({ fallbackStrategy: 'bestFit' }),
    ],
  });

  return (
    <div
      id="music-together-setting-button"
      class={`${buttonStyle()} style-scope ytmusic-nav-bar`}
    >
      <svg
        ref={setAnchor}
        xmlns="http://www.w3.org/2000/svg"
        height="24"
        viewBox="0 -960 960 960"
        width="24"
        onClick={() => setEnabled(!enabled())}
      >
        <path d="M0-240v-63q0-43 44-70t116-27q13 0 25 .5t23 2.5q-14 21-21 44t-7 48v65H0Zm240 0v-65q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v65H240Zm540 0v-65q0-26-6.5-49T754-397q11-2 22.5-2.5t23.5-.5q72 0 116 26.5t44 70.5v63H780Zm-455-80h311q-10-20-55.5-35T480-370q-55 0-100.5 15T325-320ZM160-440q-33 0-56.5-23.5T80-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T160-440Zm640 0q-33 0-56.5-23.5T720-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T800-440Zm-320-40q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm0-80q17 0 28.5-11.5T520-600q0-17-11.5-28.5T480-640q-17 0-28.5 11.5T440-600q0 17 11.5 28.5T480-560Zm1 240Zm-1-280Z" />
      </svg>
      <Show when={enabled()}>
        <Portal>
          <div
            ref={setPanel}
            class={popupStyle()}
            style={{
              '--offset-x': `${position.x}px`,
              '--offset-y': `${position.y}px`,
            }}
          >
            <MusicTogetherPanel />
          </div>
        </Portal>
      </Show>
    </div>
  );
};
