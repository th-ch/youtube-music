export const isMusicOrVideoTrack = () => {
  let menuUrl = document.querySelector<HTMLAnchorElement>(
    'tp-yt-paper-listbox [tabindex="0"] #navigation-endpoint',
  )?.href;

  if (!menuUrl?.includes('watch?')) {
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
