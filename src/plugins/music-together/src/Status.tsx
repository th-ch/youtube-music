import { For, Match, Show, Switch } from 'solid-js';
import { css } from 'solid-styled-components';

import { status } from '../store/status';

import { cacheNoArgs } from '@/providers/decorators';
import { user } from '@/plugins/music-together/store/user';

const panelStyle = cacheNoArgs(
  () => css`
    display: flex;
    flex-direction: column;
    align-items: stretch;

    padding: 16px;
  `,
);
const containerStyle = cacheNoArgs(
  () => css`
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
  `,
);
const profileStyle = cacheNoArgs(
  () => css`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  `,
);
const itemStyle = cacheNoArgs(
  () => css`
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;

    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 14px;
    font-weight: 400;
  `,
);
const userContainerStyle = cacheNoArgs(
  () => css`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    overflow: auto;

    gap: 8px;
    padding-top: 16px;
    font-size: 14px;
  `,
);
const emptyStyle = cacheNoArgs(
  () => css`
    width: 100%;

    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
  `,
);
const spinnerContainerStyle = cacheNoArgs(
  () => css`
    display: flex;
    justify-content: center;
    align-items: center;
  `,
);
const horizontalDividerStyle = cacheNoArgs(
  () => css`
    background-color: rgba(255, 255, 255, 0.15);
    width: 100%;
    height: 1px;
  `,
);

export const MusicTogetherStatus = () => {
  return (
    <div class={panelStyle()}>
      <div class={containerStyle()}>
        <img
          class={profileStyle()}
          style={{
            width: '24px',
            height: '24px',
          }}
          src={user.thumbnail}
          alt="Profile Image"
        />
        <div class={itemStyle()}>
          <ytmd-trans key="plugins.music-together.name" />
          <span id="music-together-status-label">
            <Switch>
              <Match when={status.mode === 'disconnected'}>
                <ytmd-trans
                  key="plugins.music-together.menu.status.disconnected"
                  style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                />
              </Match>
              <Match when={status.mode === 'host'}>
                <ytmd-trans
                  key="plugins.music-together.menu.status.host"
                  style={{ color: 'rgba(255, 0, 0, 1)' }}
                />
              </Match>
              <Match when={status.mode === 'guest'}>
                <ytmd-trans
                  key="plugins.music-together.menu.status.guest"
                  style={{ color: 'rgba(255, 255, 255, 1)' }}
                />
              </Match>
              <Match when={status.mode === 'connecting'}>
                <ytmd-trans
                  key="plugins.music-together.menu.status.connecting"
                  style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                />
              </Match>
            </Switch>
          </span>
          <Show
            when={
              status.mode !== 'connecting' && status.mode !== 'disconnected'
            }
          >
            <marquee id="music-together-permission-label">
              <Switch>
                <Match when={status.permission === 'all'}>
                  <ytmd-trans
                    key="plugins.music-together.menu.permission.all"
                    style={{ color: 'rgba(255, 255, 255, 1)' }}
                  />
                </Match>
                <Match when={status.permission === 'playlist'}>
                  <ytmd-trans
                    key="plugins.music-together.menu.permission.playlist"
                    style={{ color: 'rgba(255, 255, 255, 0.75)' }}
                  />
                </Match>
                <Match when={status.permission === 'host-only'}>
                  <ytmd-trans
                    key="plugins.music-together.menu.permission.host-only"
                    style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  />
                </Match>
              </Switch>
            </marquee>
          </Show>
        </div>
      </div>
      <Show
        when={status.mode !== 'connecting' && status.mode !== 'disconnected'}
        fallback={
          <Show when={status.mode === 'connecting'}>
            <div
              class={horizontalDividerStyle()}
              style={{
                'margin-top': '16px',
                'margin-bottom': '32px',
              }}
            />
            <div class={spinnerContainerStyle()}>
              <tp-yt-paper-spinner-lite
                active
                id="music-together-host-spinner"
                class="loading-indicator style-scope music-together-spinner"
              />
            </div>
          </Show>
        }
      >
        <div class={horizontalDividerStyle()} style="margin: 16px 0;" />
        <div class={itemStyle()}>
          <ytmd-trans
            key="plugins.music-together.menu.connected-users"
            attr:count={status.users.length}
          />
        </div>
        <div class={userContainerStyle()}>
          <For
            each={status.users}
            fallback={
              <span class={emptyStyle()}>
                <ytmd-trans key="plugins.music-together.menu.empty-user" />
              </span>
            }
          >
            {(user) => (
              <img
                class={profileStyle()}
                src={user.thumbnail}
                title={user.name}
                alt={`${user.name} (${user.id})`}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};
