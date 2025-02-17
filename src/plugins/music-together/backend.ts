import prompt from 'custom-electron-prompt';

import { MusicTogetherConfig } from './types';

import promptOptions from '@/providers/prompt-options';

import getSongControls from '@/providers/song-controls';

import { IPC } from './constants';

import type { BackendContext } from '@/types/contexts';

export const onMainLoad = ({
  ipc,
  window,
}: BackendContext<MusicTogetherConfig>) => {
  const controller = getSongControls(window);

  ipc.handle(IPC.prompt, async (title: string, label: string) =>
    prompt({
      title,
      label,
      type: 'input',
      ...promptOptions(),
    }),
  );

  ipc.handle(IPC.play, () => controller.play());
  ipc.handle(IPC.pause, () => controller.pause());
  ipc.handle(IPC.previous, () => controller.previous());
  ipc.handle(IPC.next, () => controller.next());
  ipc.handle(IPC.seekTo, (seconds: number) => controller.seekTo(seconds));
  ipc.handle(
    IPC.addSongToQueue,
    (
      ids: string | string[],
      options: {
        queueInsertPosition?: 'INSERT_AT_END' | 'INSERT_AFTER_CURRENT_VIDEO';
        index?: number;
      },
    ) => controller.addSongToQueue(ids, options),
  );
  ipc.handle(IPC.removeSongFromQueue, (index: number) =>
    controller.removeSongFromQueue(index),
  );
  ipc.handle(IPC.moveSongInQueue, (fromIndex: number, toIndex: number) =>
    controller.moveSongInQueue(fromIndex, toIndex),
  );
  ipc.handle(IPC.clearQueue, () => controller.clearQueue());
  ipc.handle(IPC.setQueueIndex, (index: number) =>
    controller.setQueueIndex(index),
  );
};
