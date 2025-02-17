import { DataConnection } from 'peerjs';

import { RendererContext } from '@/types/contexts';

import { queue } from '@/plugins/music-together/store/queue';

import { AppElement } from '@/types/queue';

import { ConnectionEventUnion, MusicTogetherConfig } from '../types';
import { setStatus, status } from '../store/status';
import { IPC } from '../constants';
import { Connection } from '../connection';

type BuildListenerOptions = {
  ipc: RendererContext<MusicTogetherConfig>['ipc'];
  app: AppElement;
};
export const Host = {
  buildListener: (conn: Connection, { ipc, app }: BuildListenerOptions) => {
    const listener = async (
      event: ConnectionEventUnion,
      dataConnection?: DataConnection,
    ) => {
      switch (event.type) {
        case 'ADD_SONGS': {
          if (dataConnection && status.permission === 'host-only') return;

          await ipc.invoke(
            IPC.addSongToQueue,
            event.payload.videoList.map((v) => v.videoId),
            {
              index: event.payload.index,
            },
          );
          console.log('ADD_SONGS', event);
          await conn?.broadcast(event.type, event.payload);
          break;
        }
        case 'REMOVE_SONG': {
          if (dataConnection && status.permission === 'host-only') return;

          await ipc.invoke(IPC.removeSongFromQueue, event.payload.index);
          await conn?.broadcast(event.type, event.payload);
          break;
        }
        case 'MOVE_SONG': {
          if (dataConnection && status.permission === 'host-only') {
            // await conn.broadcast('SYNC_QUEUE', {
            //   videoList: queue?.videoList ?? [],
            // });
            break;
          }

          await ipc.invoke(
            IPC.moveSongInQueue,
            event.payload.fromIndex,
            event.payload.toIndex,
          );
          await conn?.broadcast(event.type, event.payload);
          break;
        }
        case 'IDENTIFY': {
          const newUser = event.payload?.user;
          if (!newUser) return;

          // api?.toastService?.show(
          //   t('plugins.music-together.toast.user-connected', {
          //     name: event.payload.profile.name,
          //   }),
          // );

          setStatus('users', (users) => [...users, newUser]);
          await conn?.broadcast('SYNC_USER', {
            users: status.users,
          });
          break;
        }
        case 'SYNC_USER': {
          await conn?.broadcast('SYNC_USER', {
            users: status.users,
          });

          break;
        }
        case 'PERMISSION': {
          await conn?.broadcast('PERMISSION', status.permission);
          break;
        }
        case 'SYNC_QUEUE': {
          await conn?.broadcast('SYNC_QUEUE', {
            videoList: queue.queue,
          });
          break;
        }
        case 'SYNC_PROGRESS': {
          let permissionLevel = 0;
          if (status.permission === 'all') permissionLevel = 2;
          if (status.permission === 'playlist') permissionLevel = 1;
          if (status.permission === 'host-only') permissionLevel = 0;
          if (!conn) permissionLevel = 3;

          if (permissionLevel >= 2) {
            if (typeof event.payload?.progress === 'number') {
              const currentTime = app.playerApi?.getCurrentTime() ?? 0;
              const offset = Math.abs(event.payload.progress - currentTime);
              if (offset > 3)
                app.playerApi?.seekTo(event.payload.progress + offset);
            }
            if (app.playerApi?.getPlayerState() !== event.payload?.state) {
              if (event.payload?.state === 2) app.playerApi?.pauseVideo();
              if (event.payload?.state === 1) app.playerApi?.playVideo();
            }
          }
          if (permissionLevel >= 1) {
            if (typeof event.payload?.index === 'number') {
              await ipc.invoke(IPC.setQueueIndex, event.payload.index);
            }
          }

          await conn?.broadcast('SYNC_PROGRESS', event.payload);
          break;
        }
        default: {
          console.warn('Music Together [Host]: Unknown Event', event);
          break;
        }
      }

      if (event.after) {
        const now = event.after.shift();
        if (now) {
          now.after = event.after;
          await listener(now, dataConnection);
        }
      }
    };

    return listener;
  },
};
