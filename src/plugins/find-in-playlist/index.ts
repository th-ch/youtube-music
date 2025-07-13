import { t } from '@/i18n';
import { createPlugin } from '@/utils';
import { onUnloadPlaylist, onPlayerApiReady } from './renderer';
import { addSearch } from './searchHandle';

interface songElement {
  name: string;
  id: string;
  playListId: string;
  imgUrl: {
    url?: string;
    width?: number;
    height?: number;
  } | null;
  duration: string;
}

type urlInfo = {
  url: string;
  pageType: string | null;
  playlistId: string | null;
};
export default createPlugin({
  name: () => t('plugins.find-onplaylist.name'),
  description: () => t('plugins.find-onplaylist.description'),
  restartNeeded: true,
  config: {
    enabled: true,
  },
  backend: {
    urlInfo: {} as urlInfo,
    start({ window }) {
      window.webContents.on('did-finish-load', () => {
        const currentUrl = new URL(window.webContents.getURL());
        sendListUrl(currentUrl);
        console.log('did-finish-load');
      });
      window.webContents.on('did-navigate-in-page', () => {
        const currentUrl = new URL(window.webContents.getURL());
        sendListUrl(currentUrl);
      });

      const sendListUrl = (url: URL) => {
        console.log('sendListUrl');
        window.webContents.send('ytmd:playlist-url', {
          url: url.toString(),
          pageType:
            (url.pathname.includes('watch') ? 'watch' : null) ||
            (url.pathname.includes('playlist') ? 'playlist' : null),
          playlistId: url.searchParams.get('list'),
        });
      };
    },
  },
  renderer: {
    urlInfo: {} as urlInfo,
    playList: [] as songElement[],
    initialLoad: true as boolean,
    start(ctx) {
      this.initialLoad = true;

      const refreshedPage = (data: urlInfo) => {
        console.log(data);
      };

      let timer: ReturnType<typeof setTimeout>;
      ctx.ipc.on('ytmd:playlist-url', (data: urlInfo) => {
        if (!this.initialLoad) {
          refreshedPage(data);
        } else {
          clearTimeout(timer);
          timer = setTimeout(() => {
            refreshedPage(data);
            this.initialLoad = false;
          }, 750);
        }
      });
    },
    stop: onUnloadPlaylist,
    onPlayerApiReady,
  },
});
