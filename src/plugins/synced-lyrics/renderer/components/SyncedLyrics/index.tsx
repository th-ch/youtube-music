import { LineLyrics } from '@/plugins/synced-lyrics/types';
import { createEffect, createMemo, createSignal } from 'solid-js';
import { VirtualizerHandle, VList } from 'virtua/solid';
import { currentTime } from '../LyricsContainer';
import { SyncedLine } from './SyncedLine';

interface SyncedLineContainerProps {
  lyrics: LineLyrics[];
  hasJapanese: boolean;
  hasKorean: boolean;
}

export const SyncedLineContainer = (props: SyncedLineContainerProps) => {
  const [scroller, setScroller] = createSignal<VirtualizerHandle>();

  const statuses = createMemo(
    () => {
      const time = currentTime();
      return props.lyrics.map((line) => {
        if (line.timeInMs >= time) return 'upcoming';
        if (time - line.timeInMs >= line.duration) return 'previous';
        return 'current';
      });
    },
    props.lyrics.map((_) => 'upcoming'),
  );

  const [currentIndex, setCurrentIndex] = createSignal(0);
  createEffect(() => {
    const index = statuses().findIndex((status) => status === 'current');
    if (index === -1) return;
    setCurrentIndex(index);
  });

  createEffect(() => {
    if (!scroller()) return;

    scroller()!.scrollToIndex(currentIndex(), {
      smooth: true,
      align: 'center',
    });
  });

  return (
    <>
      <VList
        ref={setScroller}
        data={props.lyrics}
        style={{ 'scrollbar-width': 'none' }}
      >
        {(line, idx) => (
          <SyncedLine
            scroller={scroller()!}
            index={idx}
            line={line}
            status={statuses()[idx]}
            hasJapanese={props.hasJapanese}
            hasKorean={props.hasKorean}
          />
        )}
      </VList>
    </>
  );
};
