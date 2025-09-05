import { singleton } from './decorators';

import type { YoutubePlayer } from '@/types/youtube-player';
import type { GetState } from '@/types/datahost-get-state';
import type {
  AlbumDetails,
  PlayerOverlays,
  VideoDataChangeValue,
} from '@/types/player-api-events';

import type { SongInfo } from './song-info';
import type { VideoDataChanged } from '@/types/video-data-changed';

let songInfo: SongInfo = {} as SongInfo;
export const getSongInfo = () => songInfo;

window.ipcRenderer.on('ytmd:update-song-info', (_, extractedSongInfo: SongInfo) => {
  songInfo = extractedSongInfo;
});

const srcChangedEvent = new CustomEvent('ytmd:src-changed');
const INSTANT_TITLE_WAIT_MS = 150;

/* Basic listeners */
export const setupSeekedListener = singleton(() => {
  document.querySelector('video')?.addEventListener('seeked', (v) => {
    if (v.target instanceof HTMLVideoElement) {
      window.ipcRenderer.send('ytmd:seeked', v.target.currentTime);
    }
  });
});

export const setupTimeChangedListener = singleton(() => {
  const progressObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target as Node & { value: string };
      const numberValue = Number(target.value);
      window.ipcRenderer.send('ytmd:time-changed', numberValue);
      songInfo.elapsedSeconds = numberValue;
    }
  });
  const progressBar = document.querySelector('#progress-bar');
  if (progressBar) progressObserver.observe(progressBar, { attributeFilter: ['value'] });
});

export const setupRepeatChangedListener = singleton(() => {
  const repeatObserver = new MutationObserver((mutations) => {
    window.ipcRenderer.send(
      'ytmd:repeat-changed',
      (
        mutations[0].target as Node & {
          __dataHost: { getState: () => GetState };
        }
      ).__dataHost.getState().queue.repeatMode,
    );
  });
  repeatObserver.observe(document.querySelector('#right-controls .repeat')!, {
    attributeFilter: ['title'],
  });

  window.ipcRenderer.send(
    'ytmd:repeat-changed',
    document
      .querySelector<HTMLElement & { getState: () => GetState }>('ytmusic-player-bar')
      ?.getState().queue.repeatMode,
  );
});

export const setupVolumeChangedListener = singleton((api: YoutubePlayer) => {
  document.querySelector('video')?.addEventListener('volumechange', () => {
    window.ipcRenderer.send('ytmd:volume-changed', api.getVolume());
  });
  window.ipcRenderer.send('ytmd:volume-changed', api.getVolume());
});

export const setupShuffleChangedListener = singleton(() => {
  const playerBar = document.querySelector('ytmusic-player-bar');
  if (!playerBar) {
    window.ipcRenderer.send('ytmd:shuffle-changed-supported', false);
    return;
  }
  const observer = new MutationObserver(() => {
    window.ipcRenderer.send(
      'ytmd:shuffle-changed',
      (playerBar?.attributes.getNamedItem('shuffle-on') ?? null) !== null,
    );
  });
  observer.observe(playerBar, { attributes: true });
});

export const setupFullScreenChangedListener = singleton(() => {
  const playerBar = document.querySelector('ytmusic-player-bar');
  if (!playerBar) {
    window.ipcRenderer.send('ytmd:fullscreen-changed-supported', false);
    return;
  }
  const observer = new MutationObserver(() => {
    window.ipcRenderer.send(
      'ytmd:fullscreen-changed',
      (playerBar?.attributes.getNamedItem('player-fullscreened') ?? null) !== null,
    );
  });
  observer.observe(playerBar, { attributes: true });
});

export const setupAutoPlayChangedListener = singleton(() => {
  const autoplaySlider = document.querySelector<HTMLInputElement>(
    '.autoplay > tp-yt-paper-toggle-button',
  );
  if (!autoplaySlider) return;
  const observer = new MutationObserver(() => {
    window.ipcRenderer.send('ytmd:autoplay-changed');
  });
  observer.observe(autoplaySlider, { attributes: true });
});

/* Title extraction helpers */
const normalize = (s?: string | null) => s?.replace(/\s+/g, ' ').trim() || undefined;
const normalizeLower = (s?: string | null) =>
  s?.toLowerCase().replace(/\s+/g, ' ').trim() || undefined;

const isPlausibleTitle = (t?: string | null): t is string => {
  const v = normalize(t);
  return !!v && v.toLowerCase() !== 'youtube music' && v.length >= 2;
};
const hasFeat = (t?: string | null) => !!t && /\b(?:feat|featuring|ft)\.?\b/i.test(t);

const titleSelectors = ['#song-title', 'a#song-title', 'yt-formatted-string#song-title'] as const;

function getPlayerBar(): HTMLElement | null {
  return document.querySelector('ytmusic-player-bar');
}
function queryTitleElement(playerBar?: Element | null): HTMLElement | null {
  const root = playerBar ?? getPlayerBar();
  if (!root) return null;
  for (const sel of titleSelectors) {
    const el = root.querySelector(sel) as HTMLElement | null;
    if (el) return el;
  }
  return null;
}
function extractDomTitleFromPlayerBar(playerBar?: Element | null): string | undefined {
  const root = playerBar ?? getPlayerBar();
  if (!root) return undefined;
  for (const sel of titleSelectors) {
    const el = root.querySelector<HTMLElement>(sel);
    if (!el) continue;
    const t =
      normalize(el.getAttribute('title')) ||
      normalize(el.getAttribute('aria-label')) ||
      normalize(el.textContent);
    if (isPlausibleTitle(t)) return t;
  }
  return undefined;
}
function extractOverlayTitle(playerOverlay?: PlayerOverlays): string | undefined {
  const runs =
    playerOverlay?.playerOverlayRenderer?.browserMediaSession?.browserMediaSessionRenderer?.title
      ?.runs;
  if (!runs || !Array.isArray(runs)) return undefined;
  const text = runs.map((r: { text: string }) => r.text).join('');
  const t = normalize(text);
  return isPlausibleTitle(t) ? t : undefined;
}
function extractFromDocumentTitle(): string | undefined {
  const docTitle = normalize(document.title);
  if (!docTitle || docTitle.toLowerCase() === 'youtube music') return undefined;
  if (!/[-•]/.test(docTitle)) return undefined;
  const withoutSuffix = docTitle.replace(/\s*-\s*YouTube Music$/i, '');
  const first = normalize(withoutSuffix.split(/\s[-•]\s/)[0]);
  return isPlausibleTitle(first) ? first : undefined;
}
function pickBestTitleCandidate(dom?: string, overlay?: string, doc?: string): string | undefined {
  const candidates = [dom, overlay, doc].filter(isPlausibleTitle) as string[];
  if (candidates.length === 0) return undefined;
  const withFeat = candidates.filter((c) => hasFeat(c));
  if (withFeat.length >= 1) return withFeat.sort((a, b) => b.length - a.length)[0];
  return candidates.sort((a, b) => b.length - a.length)[0];
}

/* Duplicate detection + alternative title */
function splitByCommonDelims(s: string): string[] {
  return s
    .split(/(?:\s*[;,&/•|+x]\s*|\s+\band\b\s+|\s+\bwith\b\s+)/i)
    .map((t) => t.trim())
    .filter(Boolean);
}
type ParsedGroup = {
  start: number;
  end: number;
  open: string;
  close: string;
  inner: string;
  isFeat: boolean;
  artists?: string[];
  tokens?: string[];
};
function parseGroups(title: string): ParsedGroup[] {
  const groups: ParsedGroup[] = [];
  const groupRegex = /([\(\[\{])\s*([^()\[\]{}]+?)\s*([\)\]\}])/g;
  let m: RegExpExecArray | null;
  while ((m = groupRegex.exec(title)) !== null) {
    const open = m[1];
    const inner = m[2];
    const close = m[3];
    const isFeat = /^\s*(?:feat|featuring|ft)\.?\b/i.test(inner);
    if (isFeat) {
      const artists = splitByCommonDelims(
        inner.replace(/^\s*(?:feat|featuring|ft)\.?\s*/i, ''),
      )
        .map((a) => a.toLowerCase().replace(/\s+/g, ' ').replace(/\.+$/g, '').trim())
        .filter(Boolean);
      groups.push({ start: m.index, end: m.index + m[0].length, open, close, inner, isFeat, artists });
    } else {
      const tokens = splitByCommonDelims(inner)
        .map((t) => t.toLowerCase().replace(/\s+/g, ' ').replace(/\.+$/g, '').trim())
        .filter(Boolean);
      groups.push({ start: m.index, end: m.index + m[0].length, open, close, inner, isFeat, tokens });
    }
  }
  return groups;
}
function hasDuplicatedBracketContent(title: string): boolean {
  const groups = parseGroups(title);
  if (groups.length === 0) return false;
  const seenArtists = new Set<string>();
  const seenTokens = new Set<string>();
  for (const g of groups) {
    if (g.isFeat) {
      const a = g.artists ?? [];
      const newOnes = a.filter((x) => !seenArtists.has(x));
      if (a.length > 0 && newOnes.length === 0) return true;
      newOnes.forEach((x) => seenArtists.add(x));
    } else {
      const t = g.tokens ?? [];
      const newOnes = t.filter((x) => !seenTokens.has(x));
      if (t.length > 0 && newOnes.length === 0) return true;
      newOnes.forEach((x) => seenTokens.add(x));
    }
  }
  return false;
}
function getBaseBeforeFirstBracket(title: string): string | undefined {
  const firstBracketIdx = title.search(/[\(\[\{]/);
  const base = firstBracketIdx >= 0 ? title.slice(0, firstBracketIdx) : title;
  return normalize(base);
}
function alternativeMatchesCurrentBase(alt?: string, raw?: string): boolean {
  const altN = normalizeLower(alt);
  const baseN = normalizeLower(getBaseBeforeFirstBracket(raw));
  if (!altN || !baseN) return false;
  // Require alt to start with the current base (prevents using previous song's alt)
  return altN.startsWith(baseN);
}
function buildAlternativeFrom(title: string): string | undefined {
  const groups = parseGroups(title);
  const firstGroup = groups[0];
  const base = normalize(firstGroup ? title.slice(0, firstGroup.start) : title);
  if (!base) return undefined;
  const firstFeat = groups.find((g) => g.isFeat && (g.artists?.length ?? 0) > 0);
  if (firstFeat) {
    const rawInner = firstFeat.inner.replace(/^\s*(?:feat|featuring|ft)\.?\s*/i, '').trim();
    return `${base} (feat. ${rawInner})`.replace(/\s{2,}/g, ' ').trim();
  }
  return base;
}
function chooseSafeAlternative(raw: string, altFromSongInfo?: string): string | undefined {
  const immediateAlt = buildAlternativeFrom(raw);
  if (alternativeMatchesCurrentBase(altFromSongInfo, raw) && isPlausibleTitle(altFromSongInfo)) {
    return altFromSongInfo!;
  }
  return isPlausibleTitle(immediateAlt) ? immediateAlt : undefined;
}

/* Short-wait best title */
async function getBestRawTitleWithShortWait(
  overlay: PlayerOverlays | undefined,
  maxWaitMs: number,
): Promise<string | undefined> {
  const choose = () =>
    pickBestTitleCandidate(
      extractDomTitleFromPlayerBar(),
      extractOverlayTitle(overlay),
      extractFromDocumentTitle(),
    );
  const now = choose();
  if (now || maxWaitMs <= 0) return now;

  const playerBar = getPlayerBar();
  const titleEl = queryTitleElement(playerBar);
  if (!titleEl) {
    await new Promise((r) => setTimeout(r, Math.min(50, maxWaitMs)));
    return choose();
  }

  return await new Promise<string | undefined>((resolve) => {
    let settled = false;
    const tryResolve = () => {
      if (settled) return;
      const cand = choose();
      if (cand) {
        settled = true;
        mo.disconnect();
        clearTimeout(timeoutId);
        resolve(cand);
      }
    };
    const mo = new MutationObserver(() => tryResolve());
    mo.observe(titleEl, {
      attributes: true,
      attributeFilter: ['title', 'aria-label'],
      childList: true,
      characterData: true,
      subtree: true,
    });
    requestAnimationFrame(() => requestAnimationFrame(tryResolve));
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      mo.disconnect();
      resolve(choose());
    }, maxWaitMs);
  });
}

/* Observer for late title improvements */
const titleObservers = new Map<string, { stop: () => void }>();
function stopAllTitleObserversExcept(videoId: string) {
  for (const [id, o] of titleObservers) {
    if (id !== videoId) {
      try {
        o.stop();
      } catch {}
      titleObservers.delete(id);
    }
  }
}
function startTitleObserverOnce(
  videoId: string,
  baseData: ReturnType<YoutubePlayer['getPlayerResponse']>,
) {
  if (titleObservers.has(videoId)) return;
  const playerBar = getPlayerBar();
  const titleEl = queryTitleElement(playerBar);
  if (!playerBar || !titleEl) return;

  const isBetter = (current: string, candidate?: string) => {
    if (!candidate || candidate === current) return false;
    if (hasFeat(candidate) && !hasFeat(current)) return true;
    return candidate.length > current.length;
  };

  const emitIfImproves = () => {
    const domRaw = extractDomTitleFromPlayerBar(playerBar) || extractFromDocumentTitle();
    if (!domRaw) return;

    const altFromSongInfo = (songInfo as any)?.alternativeTitle as string | undefined;
    const candidate =
      (hasDuplicatedBracketContent(domRaw) ? chooseSafeAlternative(domRaw, altFromSongInfo) : domRaw) ||
      domRaw;

    const current = baseData.videoDetails.title;
    if (isBetter(current, candidate)) {
      const updated = {
        ...baseData,
        videoDetails: { ...baseData.videoDetails, title: candidate },
      };
      window.ipcRenderer.send('ytmd:video-src-changed', updated);
      stop();
    }
  };

  const mo = new MutationObserver(() => emitIfImproves());
  mo.observe(titleEl, {
    attributes: true,
    attributeFilter: ['title', 'aria-label'],
    childList: true,
    characterData: true,
    subtree: true,
  });

  const stop = () => {
    try {
      mo.disconnect();
    } catch {}
    titleObservers.delete(videoId);
  };
  titleObservers.set(videoId, { stop });
}

/* Main */
export default (api: YoutubePlayer) => {
  window.ipcRenderer.on('ytmd:setup-time-changed-listener', () => {
    setupTimeChangedListener();
  });
  window.ipcRenderer.on('ytmd:setup-repeat-changed-listener', () => {
    setupRepeatChangedListener();
  });
  window.ipcRenderer.on('ytmd:setup-volume-changed-listener', () => {
    setupVolumeChangedListener(api);
  });
  window.ipcRenderer.on('ytmd:setup-shuffle-changed-listener', () => {
    setupShuffleChangedListener();
  });
  window.ipcRenderer.on('ytmd:setup-fullscreen-changed-listener', () => {
    setupFullScreenChangedListener();
  });
  window.ipcRenderer.on('ytmd:setup-autoplay-changed-listener', () => {
    setupAutoPlayChangedListener();
  });
  window.ipcRenderer.on('ytmd:setup-seeked-listener', () => {
    setupSeekedListener();
  });

  const playPausedHandler = (e: Event, status: string) => {
    if (e.target instanceof HTMLVideoElement && Math.round(e.target.currentTime) > 0) {
      window.ipcRenderer.send('ytmd:play-or-paused', {
        isPaused: status === 'pause',
        elapsedSeconds: Math.floor(e.target.currentTime),
      });
    }
  };
  const playPausedHandlers = {
    playing: (e: Event) => playPausedHandler(e, 'playing'),
    pause: (e: Event) => playPausedHandler(e, 'pause'),
  };

  const videoEventDispatcher = async (name: string, videoData: VideoDataChangeValue) =>
    document.dispatchEvent(
      new CustomEvent<VideoDataChanged>('videodatachange', { detail: { name, videoData } }),
    );

  const waitingEvent = new Set<string>();
  api.addEventListener('videodatachange', (name, videoData) => {
    videoEventDispatcher(name, videoData);
    if (name === 'dataupdated' && waitingEvent.has(videoData.videoId)) {
      waitingEvent.delete(videoData.videoId);
      void sendSongInfo(videoData);
    } else if (name === 'dataloaded') {
      const video = document.querySelector<HTMLVideoElement>('video');
      video?.dispatchEvent(srcChangedEvent);
      for (const status of ['playing', 'pause'] as const) {
        video?.addEventListener(status, playPausedHandlers[status]);
      }
      waitingEvent.add(videoData.videoId);
    }
  });

  const video = document.querySelector('video');
  if (video) {
    for (const status of ['playing', 'pause'] as const) {
      video.addEventListener(status, playPausedHandlers[status]);
    }
    if (!isNaN(video.duration)) {
      const { title, author, video_id: videoId, list: playlistId } = api.getVideoData();
      const watchNextResponse = api.getWatchNextResponse();
      void sendSongInfo({
        title,
        author,
        videoId,
        playlistId,
        isUpcoming: false,
        lengthSeconds: video.duration,
        loading: true,
        ytmdWatchNextResponse: watchNextResponse,
      } satisfies VideoDataChangeValue);
    }
  }

  async function sendSongInfo(videoData: VideoDataChangeValue) {
    const data = api.getPlayerResponse();

    let playerOverlay: PlayerOverlays | undefined;
    if (!videoData.ytmdWatchNextResponse) {
      playerOverlay = (
        Object.entries(videoData).find(
          ([, value]) => value && Object.hasOwn(value, 'playerOverlays'),
        ) as [string, AlbumDetails | undefined]
      )?.[1]?.playerOverlays;
    } else {
      playerOverlay = videoData.ytmdWatchNextResponse?.playerOverlays;
    }

    try {
      const raw =
        (await getBestRawTitleWithShortWait(playerOverlay, INSTANT_TITLE_WAIT_MS)) ||
        data.videoDetails.title;

      let finalTitle = raw;
      if (raw && hasDuplicatedBracketContent(raw)) {
        const altFromSongInfo = (songInfo as any)?.alternativeTitle as string | undefined;
        finalTitle = chooseSafeAlternative(raw, altFromSongInfo) || raw;
      }

      if (isPlausibleTitle(finalTitle)) {
        data.videoDetails.title = finalTitle;
      }
    } catch {
      /* keep API title */
    }

    data.videoDetails.album =
      playerOverlay?.playerOverlayRenderer?.browserMediaSession?.browserMediaSessionRenderer?.album
        ?.runs?.at(0)?.text;
    data.videoDetails.elapsedSeconds = 0;
    data.videoDetails.isPaused = false;

    window.ipcRenderer.send('ytmd:video-src-changed', data);

    stopAllTitleObserversExcept(videoData.videoId);
    startTitleObserverOnce(videoData.videoId, data);
  }
};
