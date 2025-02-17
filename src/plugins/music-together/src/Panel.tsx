import { css } from 'solid-styled-components';
import { createEffect, Match, Switch } from 'solid-js';

import { PanelItem } from './PanelItem';
import { MusicTogetherStatus } from './Status';
import {
  IconConnect,
  IconKey,
  IconMusicCast,
  IconOff,
  IconTune,
} from './icons';

import { cacheNoArgs } from '@/providers/decorators';
import { t } from '@/i18n';

import { AppElement } from '@/types/queue';

import { Host } from '../api/host';
import { Guest } from '../api/guest';
import { Connection } from '../connection';
import { useToast } from '../context/ToastContext';
import { setStatus, status } from '../store/status';
import { connection, setConnection } from '../store/connection';
import { useRendererContext } from '../context/RendererContext';

const panelStyle = cacheNoArgs(
  () => css`
    border-radius: 10px !important;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  `,
);
const horizontalDividerStyle = cacheNoArgs(
  () => css`
    background-color: rgba(255, 255, 255, 0.15);
    width: 100%;
    height: 1px;
  `,
);

export const MusicTogetherPanel = () => {
  const show = useToast();
  const { ipc } = useRendererContext();

  const onHost = async () => {
    setStatus('mode', 'connecting');
    const result = new Connection();
    await result.waitForReady();
    setStatus('mode', 'host');
    setConnection(result);

    await onHostCopy();
  };
  const onHostCopy = async () => {
    const id = connection()?.id;

    if (!id) {
      show(t('plugins.music-together.toast.id-copy-failed'));
      return;
    }
    const success = await navigator.clipboard
      .writeText(id)
      .then(() => true)
      .catch(() => false);

    if (!success) {
      show(t('plugins.music-together.toast.id-copy-failed'));
      return;
    }

    show(t('plugins.music-together.toast.id-copied', { id }));
  };

  const onClose = () => {
    setStatus('mode', 'disconnected');
    connection()?.disconnect();
    setConnection(null);

    show(t('plugins.music-together.toast.closed'));
  };

  createEffect(() => {
    const conn = connection();
    const mode = status.mode;
    const app = document.querySelector<AppElement>('ytmusic-app');

    if (conn && app) {
      if (mode === 'host') {
        const listener = Host.buildListener(conn, {
          ipc,
          app,
        });
        conn.on(listener);
      }
      if (mode === 'guest') {
        const listener = Guest.buildListener(conn, {
          ipc,
          app,
        });
        conn.on(listener);
      }
    }
  });

  return (
    <tp-yt-paper-listbox
      class={`style-scope ytmusic-menu-popup-renderer ${panelStyle()}`}
    >
      <MusicTogetherStatus />
      <Switch>
        <Match when={status.mode === 'disconnected'}>
          <div class={horizontalDividerStyle()} />
          <PanelItem
            text={t('plugins.music-together.menu.host')}
            icon={<IconMusicCast width={24} height={24} />}
            onClick={onHost}
          />
          <PanelItem
            text={t('plugins.music-together.menu.join')}
            icon={<IconConnect width={24} height={24} />}
          />
        </Match>
        <Match when={status.mode === 'host'}>
          <div class={horizontalDividerStyle()} />
          <PanelItem
            text={t('plugins.music-together.menu.click-to-copy-id')}
            icon={<IconKey width={24} height={24} />}
            onClick={onHostCopy}
          />
          <PanelItem
            text={t('plugins.music-together.menu.set-permission', {
              permission: t('plugins.music-together.menu.permission.host-only'),
            })}
            icon={<IconTune width={24} height={24} />}
          />
          <div class={horizontalDividerStyle()} />
          <PanelItem
            text={t('plugins.music-together.menu.close')}
            icon={<IconOff width={24} height={24} />}
            onClick={onClose}
          />
        </Match>
        <Match when={status.mode === 'guest'}>
          <div class={horizontalDividerStyle()} />
          <PanelItem
            text={t('plugins.music-together.menu.close')}
            icon={<IconOff width={24} height={24} />}
            onClick={onClose}
          />
        </Match>
      </Switch>
    </tp-yt-paper-listbox>
  );
};
