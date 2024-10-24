import { LineLyrics, LyricProvider } from '@/plugins/synced-lyrics/types';
import { jaroWinkler } from '@skyra/jaro-winkler';
import { config } from '../renderer/renderer';

const removeNoise = (text: string) => {
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .trim()
    .replace(/(^[-•])|([-•]$)/g, '')
    .trim()
    .replace(/\s+by$/, '');
};

// TODO: Use an LRC parser instead of this.
function extractTimeAndText(line: string, index: number): LineLyrics | null {
  const groups = /\[(\d+):(\d+)\.(\d+)\](.+)/.exec(line);
  if (!groups) return null;

  const [, rMinutes, rSeconds, rMillis, text] = groups;
  const [minutes, seconds, millis] = [
    parseInt(rMinutes),
    parseInt(rSeconds),
    parseInt(rMillis),
  ];

  // prettier-ignore
  const timeInMs = (minutes * 60 * 1000) + (seconds * 1000) + millis;

  // prettier-ignore
  return {
    index,
    timeInMs,
    time: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${millis}`,
    text: text?.trim() ?? config()!.defaultTextString,
    status: 'upcoming',
    duration: 0,
  };
}

export const Megalobiz = {
  name: 'Megalobiz',
  baseUrl: 'https://www.megalobiz.com',
  domParser: new DOMParser(),

  // prettier-ignore
  async search({ title, artist, songDuration }) {
    const query = new URLSearchParams({
      qry: `${artist} ${title}`,
    });

    const response = await fetch(`${this.baseUrl}/search/all?${query}`);
    if (!response.ok) {
      throw new Error('Failed to fetch lyrics');
    }

    const data = await response.text();
    const searchDoc = this.domParser.parseFromString(data, 'text/html');
    const searchResults = Array.prototype.map
      .call(
        searchDoc.querySelectorAll(
          `a.entity_name[href^="/lrc/maker/"][name][title]`,
        ),
        (anchor: HTMLAnchorElement) => {
          const { minutes, seconds, millis } = anchor
            .getAttribute('title')!
            .match(
              /\[(?<minutes>\d+):(?<seconds>\d+)\.(?<millis>\d+)\]/,
            )!.groups!;

          let name = anchor.getAttribute('name')!;

          // prettier-ignore
          const artists = [
          removeNoise(name.match(/\(?[Ff]eat\. (.+)\)?/)?.[1] ?? ""),
          ...(removeNoise(name).match(/(?<artists>.*?) [-•] (?<title>.*)/)?.groups?.artists?.split(/[&,]/)?.map(removeNoise) ?? []),
          ...(removeNoise(name).match(/(?<title>.*) by (?<artists>.*)/)?.groups?.artists?.split(/[&,]/)?.map(removeNoise) ?? []),
        ].filter(Boolean);

          for (const artist of artists) {
            name = name.replace(artist, '');
            name = removeNoise(name);
          }

          if (jaroWinkler(title, name) < 0.8) return null;

          return {
            title: name,
            artists,
            href: anchor.getAttribute('href')!,
            duration:
              parseInt(minutes) * 60 +
              parseInt(seconds) +
              parseInt(millis) / 1000,
          };
        },
      )
      .filter(Boolean) as MegalobizSearchResult[];

    const sortedResults = searchResults.sort(
      ({ duration: durationA }, { duration: durationB }) => {
        const left = Math.abs(durationA - songDuration);
        const right = Math.abs(durationB - songDuration);

        return left - right;
      },
    );

    const closestResult = sortedResults[0];
    if (!closestResult) return null;
    if (Math.abs(closestResult.duration - songDuration) > 15) {
      return null;
    }

    const html = await fetch(`${this.baseUrl}${closestResult.href}`).then((r) => r.text());
    const lyricsDoc = this.domParser.parseFromString(html, 'text/html');
    const lyrics = lyricsDoc.querySelector(`span[id^="lrc_"][id$="_lyrics"]`)?.textContent?.split('\n');
    if (!lyrics?.length) throw new Error('Failed to extract lyrics from page.');

    lyrics.unshift('[0:0.0] ');

    const syncedLyricList = lyrics.reduce<LineLyrics[]>((acc, line, index) => {
      const syncedLine = extractTimeAndText(line, index);
      if (syncedLine) {
        acc.push(syncedLine);
      }

      return acc;
    }, []);

    for (const line of syncedLyricList) {
      const next = syncedLyricList[line.index + 1];
      if (!next) {
        line.duration = Infinity;
        break;
      }

      line.duration = next.timeInMs - line.timeInMs;
    }

    return {
      title: closestResult.title,
      artists: closestResult.artists,
      lines: syncedLyricList,
    };
  },
} as LyricProvider & { domParser: DOMParser };

interface MegalobizSearchResult {
  title: string;
  artists: string[];
  href: string;
  duration: number;
}
