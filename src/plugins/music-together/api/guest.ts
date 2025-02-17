import { setQueue } from '../store/queue';

import { ConnectionEventUnion, MusicTogetherConfig, VideoData } from '../types';
import { setStatus } from '../store/status';
import { IPC } from '../constants';
import { Connection } from '../connection';

import type { AppElement } from '@/types/queue';
import type { RendererContext } from '@/types/contexts';

type BuildListenerOptions = {
  ipc: RendererContext<MusicTogetherConfig>['ipc'];
  app: AppElement;
};
export const Guest = {
  buildListener: (_: Connection, { ipc, app }: BuildListenerOptions) => {
    const listener = async (event: ConnectionEventUnion) => {
      switch (event.type) {
        case 'ADD_SONGS': {
          await ipc.invoke(
            IPC.addSongToQueue,
            event.payload.videoList.map((v) => v.videoId),
            {
              index: event.payload.index,
            },
          );

          setQueue('queue', (queue) => {
            const result: VideoData[] = [...queue];

            if (event.payload.index) {
              result.splice(event.payload.index, 0, ...event.payload.videoList);
            } else {
              result.push(...event.payload.videoList);
            }

            return result;
          });
          break;
        }
        case 'REMOVE_SONG': {
          await ipc.invoke(IPC.removeSongFromQueue, event.payload.index);

          setQueue('queue', (queue) => {
            const result: VideoData[] = [...queue];
            result.splice(event.payload.index, 1);
            return result;
          });
          break;
        }
        case 'MOVE_SONG': {
          await ipc.invoke(
            IPC.moveSongInQueue,
            event.payload.fromIndex,
            event.payload.toIndex,
          );

          setQueue('queue', (queue) => {
            const result: VideoData[] = [...queue];
            const [removed] = result.splice(event.payload.fromIndex, 1);
            result.splice(event.payload.toIndex, 0, removed);
            return result;
          });
          break;
        }
        case 'IDENTIFY': {
          console.warn('Music Together [Guest]: Not allowed Event', event);
          break;
        }
        case 'SYNC_USER': {
          setStatus('users', event.payload?.users ?? []);

          break;
        }
        case 'PERMISSION': {
          const permission = event.payload;
          if (!permission) break;

          setStatus('permission', permission);
          break;
        }
        case 'SYNC_QUEUE': {
          await ipc.invoke(IPC.clearQueue);
          await ipc.invoke(
            IPC.addSongToQueue,
            event.payload?.videoList.map((v) => v.videoId),
            {
              queueInsertPosition: 'INSERT_AT_END',
            },
          );
          setQueue('queue', event.payload?.videoList ?? []);
          break;
        }
        case 'SYNC_PROGRESS': {
          if (typeof event.payload?.progress === 'number') {
            app.playerApi?.seekTo(event.payload.progress);
          }
          if (app.playerApi?.getPlayerState() !== event.payload?.state) {
            if (event.payload?.state === 2) app.playerApi?.pauseVideo();
            if (event.payload?.state === 1) app.playerApi?.playVideo();
          }
          if (typeof event.payload?.index === 'number') {
            await ipc.invoke(IPC.setQueueIndex, event.payload.index);
          }

          break;
        }
        default: {
          console.warn('Music Together [Host]: Unknown Event', event);
          break;
        }
      }
    };

    return listener;
  },
};
