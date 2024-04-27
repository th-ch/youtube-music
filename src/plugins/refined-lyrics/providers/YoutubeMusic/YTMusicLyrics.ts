// @ts-nocheck

import { net } from "electron";
import FetchCookie from "fetch-cookie";

const client = {
  clientName: "26",
  clientVersion: "6.48.2"
}

const headers = {
  "Accept": "application/json",
  "Content-Type": "application/json",
}

export class YTMusicLyrics {
  private ENDPOINT = "https://youtubei.googleapis.com/youtubei/v1/";
  private fetch = FetchCookie(net.fetch, new FetchCookie.toughCookie.CookieJar(), true);

  public async fetchNext(videoId: string): Promise<Record<string, any>> {
    return await this.fetch(this.ENDPOINT + "next", {
      headers,
      method: "POST",
      body: JSON.stringify({
        videoId,
        context: { client }
      })
    }).then(res => res.json());
  }

  public async fetchBrowse(browseId: string): Promise<Record<string, any>> {
    return await this.fetch(this.ENDPOINT + "browse", {
      headers,
      method: "POST",
      body: JSON.stringify({
        browseId,
        context: { client }
      })
    }).then(res => res.json());
  }

  public async fetchLyrics(videoId: string) {
    const data = await this.fetchNext(videoId);
    const { tabs } = data?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer ?? {};
    if (!Array.isArray(tabs)) return null;

    const lyricsTab = tabs.find(it => {
      const pageType = it?.tabRenderer?.endpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;
      return pageType === "MUSIC_PAGE_TYPE_TRACK_LYRICS";
    });
    if (!lyricsTab) return null;

    const { browseId } = lyricsTab?.tabRenderer?.endpoint?.browseEndpoint ?? {};
    if (!browseId) return null;

    const { contents } = await this.fetchBrowse(browseId);
    if (!contents) return null;

    const synced = "elementRenderer" in contents
      ? contents?.elementRenderer?.newElement?.type?.componentType?.model?.timedLyricsModel?.lyricsData?.timedLyricsData
      : null;

    const plain = !synced
      ? contents?.messageRenderer?.text?.runs
      : null;

    return { plain, synced };
  }
}
