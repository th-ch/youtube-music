import { LineLyrics, LineLyricsStatus } from "../..";
import { config, hadSecondAttempt, syncedLyricList } from "../renderer";

export const initLyricsStyle = () => {
    let root = document.documentElement;
    switch (config.lineEffect) { // Set the line effect
      case 'scale':
      root.style.setProperty('--previous-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1.2em');
      root.style.setProperty('--offset-lyrics', '0');
      break;
      case 'offset':
      root.style.setProperty('--previous-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1em');
      root.style.setProperty('--offset-lyrics', '1em');
      break;
      case 'focus':
      root.style.setProperty('--previous-lyrics', 'var(--ytmusic-text-secondary)');
      root.style.setProperty('--current-lyrics', 'var(--ytmusic-text-primary)');
      root.style.setProperty('--size-lyrics', '1em');
      root.style.setProperty('--offset-lyrics', '0');
      break;
    }
};

export const styleLyrics = (actualLyric: LineLyrics) => {
    const lyrics = document.querySelectorAll('.synced-line');
    
    const setStatus = (lyric: Element, status: LineLyricsStatus) => {
        lyric.classList.remove('current');
        lyric.classList.remove('previous');
        lyric.classList.remove('upcoming');
        lyric.classList.add(status);
    }

    lyrics.forEach((lyric: Element) => {
    const index = parseInt(lyric.getAttribute('data-index')!);
    if (index === actualLyric.index)
        setStatus(lyric, 'current');
    else if (index < actualLyric.index)
        setStatus(lyric, 'previous');
    else 
        setStatus(lyric, 'upcoming');
    });

    const targetElement = document.querySelector<HTMLElement>('.current');
    if (targetElement)
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
};


export const setLyrics = (lyricsContainer: Element, lyrics: Array<LineLyrics> | null) => {
    let lineList = [];
    console.log(lyrics, lyricsContainer);
    if (lyrics) {
    const footer = lyricsContainer.querySelector('.footer');

    let lyricsBegin = syncedLyricList[1].timeInMs < 1000 ? 1 : 0; //If the first real lyric is before 1 second, we skip the first blank line
    for(let i = lyricsBegin; i < syncedLyricList.length; i++) {
        const line = syncedLyricList[i];
        lineList.push(`
        <div class="synced-line ${line.status}" data-index="${line.index}">
            <span class="text-lyrics">${config.showTimeCodes ? `[${line.time}] ` : ''}${line.text}</span>
        </div>
        `);
    }
    //<div id="contents" class="style-scope ytmusic-section-list-renderer description ytmusic-description-shelf-renderer synced-lyrics">
    lyricsContainer.innerHTML = `
        ${hadSecondAttempt ? '<div class="warning-lyrics">The lyrics for this song may not be exact</div>' : ''}
        ${lineList.join('')}
        <span class="footer style-scope ytmusic-description-shelf-renderer" style="align-self: baseline">Source: LRCLIB</span>
        <yt-formatted-string class="footer style-scope ytmusic-description-shelf-renderer" style="align-self: baseline">
        Source: LRCLIB
        </yt-formatted-string>
    `;
    lyricsContainer.classList.add('synced-lyrics');
    lyricsContainer.classList.add('description');

    if (footer) 
        footer.textContent = 'Source: LRCLIB';
    }
};
