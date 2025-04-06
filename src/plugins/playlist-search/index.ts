import style from './playlist-search.css?inline';
import { t } from '@/i18n';
import { debounce } from '@/providers/decorators';
import { createPlugin } from '@/utils';
import { waitForElement } from '@/utils/wait-for-element';

export const PlaylistSearchBoxID = 'custom-playlist-search-container';

export default createPlugin<
  unknown,
  unknown,
  {
    songListObserver?: MutationObserver;
    searchContainer: HTMLDivElement | null;
    searchInput: HTMLInputElement | null;
    currentSearchTerm: string;
    debounceTimeout: number | null;
    waiting: boolean;
    onPageChange: () => void;
    containsSearchTerm: (element: Element, searchTerm: string) => boolean;
    filterPlaylistItems: (
      searchTerm: string,
      shelfContainerName: string
    ) => void;
    initializeSearch: (shelfContainerName: string) => void;
    start: () => void;
    stop: () => void;
  }
>({
  name: () => t('plugins.playlist-search.name'),
  description: () => t('plugins.playlist-search.description'),
  restartNeeded: false,
  config: {
    enabled: false,
  },
  stylesheets: [style],
  renderer: {
    // state
    searchContainer: null,
    searchInput: null,
    currentSearchTerm: '',
    debounceTimeout: null,
    waiting: false,

    // methods
    containsSearchTerm(element: Element, searchTerm: string): boolean {
      //normalize the text to remove accents for easier search
      const text =
        element.textContent
          ?.toLowerCase()
          ?.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') || '';
      return text.includes(
        searchTerm
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
      );
    },
    filterPlaylistItems(searchTerm: string, shelfContainerName: string): void {
      const playlistShelf = document.querySelector(shelfContainerName);
      if (!playlistShelf) return;

      const items = playlistShelf.querySelectorAll(
        'ytmusic-responsive-list-item-renderer'
      );
      items.forEach((item) => {
        const textElements = item.querySelectorAll('yt-formatted-string');
        const hasMatch = Array.from(textElements).some((element) =>
          this.containsSearchTerm(element, searchTerm)
        );

        (item as HTMLElement).style.display = hasMatch ? '' : 'none';
      });
    },
    initializeSearch(shelfContainerName: string): void {
      const existingContainer = document.getElementById(
        `#${PlaylistSearchBoxID}`
      );

      if (existingContainer) {
        this.searchContainer = existingContainer as HTMLDivElement;
        this.searchInput = this.searchContainer.querySelector('input');
        if (this.searchInput) {
          this.searchInput.value = this.currentSearchTerm;
        }
        return;
      }

      this.currentSearchTerm = '';
      this.searchContainer = document.createElement(
        'ytmusic-search-box'
      ) as HTMLDivElement;
      this.searchContainer.id = PlaylistSearchBoxID;
      this.searchContainer.className = 'search-box style-scope ytmusic-nav-bar';
      this.searchContainer.setAttribute('is-bauhaus-sidenav-enabled', 'true');

      const shelf = document.querySelector(shelfContainerName);
      if (shelf) {
        // search goes at the top of the playlist
        shelf.insertBefore(this.searchContainer, shelf.firstChild);

        // modify the ytmusic search box to our needs after it's inserted
        this.searchInput = this.searchContainer.querySelector('input')!;
        this.searchInput.placeholder = 'Search in playlist';
        this.searchInput.value = this.currentSearchTerm;

        this.searchContainer.querySelector('#suggestion-list')?.remove();
        this.searchContainer.querySelector('#clear-button')?.remove();

        const debouncedFilter = debounce(
          (search: string, container: string) => {
            this.filterPlaylistItems(search, container);
          },
          300
        );

        this.searchInput.addEventListener('input', (e) => {
          const newSearchTerm = (e.target as HTMLInputElement).value;
          this.currentSearchTerm = newSearchTerm;
          debouncedFilter(newSearchTerm, shelfContainerName);
        });

        if (this.songListObserver) {
          this.songListObserver.disconnect();
        }

        this.songListObserver = new MutationObserver(() => {
          if (this.currentSearchTerm) {
            debouncedFilter(this.currentSearchTerm, shelfContainerName);
          }
        });

        this.songListObserver.observe(shelf.querySelector('#contents')!, {
          childList: true,
        });
      }
    },
    async onPageChange() {
      if (this.waiting) {
        return;
      } else {
        this.waiting = true;
      }
      await waitForElement<HTMLElement>('#continuations');
      this.waiting = false;

      const shelf =
        document.querySelector('ytmusic-playlist-shelf-renderer') ??
        document.querySelector('ytmusic-shelf-renderer');

      if (!shelf) return;

      this.initializeSearch(shelf.tagName);

      this.waiting = false;
    },
    start(): void {
      this.onPageChange();
      window.navigation.addEventListener('navigate', this.onPageChange);
    },

    stop(): void {
      window.navigation.removeEventListener('navigate', this.onPageChange);
      this.songListObserver?.disconnect();

      if (this.searchContainer) {
        this.searchContainer.remove();
        this.searchContainer = null;
      }

      this.searchInput = null;
      this.currentSearchTerm = '';
      this.debounceTimeout = null;
    },
  },
});
