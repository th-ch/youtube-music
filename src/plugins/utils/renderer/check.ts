export const isMusicOrVideoTrack = () => {
  const menuSelector = document.querySelector<
    HTMLAnchorElement & {
      data: {
        watchEndpoint: {
          videoId: string;
        };
        addToPlaylistEndpoint: {
          videoId: string;
        };
        clickTrackingParams: string;
      };
    }
  >('tp-yt-paper-listbox [tabindex="0"] #navigation-endpoint');
  let menuUrl =
    menuSelector?.data?.addToPlaylistEndpoint?.videoId ||
    menuSelector?.data?.watchEndpoint?.videoId;

  if (!menuUrl) {
    menuUrl = undefined;
    // check for podcast
    for (const it of document.querySelectorAll(
      'tp-yt-paper-listbox [tabindex="-1"] #navigation-endpoint',
    )) {
      if (it.getAttribute('href')?.includes('podcast/')) {
        menuUrl = it.getAttribute('href')!;
        break;
      }
    }
  }

  return !!menuUrl;
};
