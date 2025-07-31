import { t } from '@/i18n';
import { createSignal } from 'solid-js';

export const [lyricsOffset, setLyricsOffset] = createSignal(0);

export const LyricsPickerAdvanced = () => {
  const [typing, setTyping] = createSignal(false)
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        'flex-direction': 'row',
        'align-items': 'center',
        'justify-content': 'center',
      }}
    >
      <yt-formatted-string
        class="description ytmusic-description-shelf-renderer"
        text={{ runs: [{ text: t('plugins.synced-lyrics.advanced-options.offset.title') }] }}
      />
      <div style={{ display: 'flex', 'flex-direction': 'row' }}>
        <input
          class="lrcpkradv-offset"
          type="text"
          value={lyricsOffset()}
          onFocus={() => setTyping(true)}
          onBlur={(e) => {
            let value = Number(e.target.value);
            if (isNaN(value)) value = lyricsOffset();

            setLyricsOffset(value);
            setTyping(false)
          }}
          onInput={() => setTyping(true)}
        />
        <span>
          <button
            class="lrcpkradv-offset-btn"
            disabled={typing()}
            onclick={() => setLyricsOffset((old) => old - 50)}
          >
            -
          </button>
          /
          <button
            class="lrcpkradv-offset-btn"
            disabled={typing()}
            onclick={() => setLyricsOffset((old) => old + 50)}
          >
            +
          </button>
        </span>
      </div>
    </div>
  );
};
