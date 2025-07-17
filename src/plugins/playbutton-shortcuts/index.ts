import { waitForElement } from '@/utils/wait-for-element';
import { t } from '@/i18n';

import { createPlugin } from '@/utils';

const responsiveItem = 'ytmusic-responsive-list-item-renderer';
const thumbnailItem = 'ytmusic-item-thumbnail-overlay-renderer';
const queueItem = 'ytmusic-player-queue-item';
const buttonSelector = '#button-shape button';
// prettier-ignore
const shortCuts = {
    'w': 'Play next',
    'e': 'Add to queue', 
    'r': 'Save to playlist',
};
// prettier-ignore
export default createPlugin<
    unknown,
    unknown,
    {
        start: () => void,
        stop: () => void,
        onChangePage: () => void,
        settShortCuts: () => void,
        keydownEvent: (e: KeyboardEvent) => void,
        keyupEvent: (e: KeyboardEvent) => void,
        popupClicker: () => void,
        songClickEvent: (song: HTMLElement) => void,
        setupPopupObserver: () => void,
        cleanup: () => void,
        popup:() => HTMLElement | null,
        songListenerMap: Map<HTMLElement, EventListener> | null,
        waiting: boolean,
        key: string | null,
        songElement: HTMLElement | null;
        songElements: HTMLElement[];
        popupObserver: MutationObserver | null
        observer:MutationObserver | null,
    }
>({
    name: () => t('plugins.playbutton-shortcuts.name'),
    description: () => t('plugins.playbutton-shortcuts.description'),
    restartNeeded: true,
    config: {
        'enabled': true,
    },
    addedVersion: '3.2.X',
    renderer: {
        songListenerMap: null,
        waiting: false,
        key: null,
        songElement: null,
        songElements: [],
        popupObserver: null,
        observer:null,
        start() {
            const targetHost = 'music.youtube.com';
            const currentHost = window.location.host;

            // Eğer zaten music.youtube.com'daysak, yönlendirme yapma
            if (currentHost !== targetHost) {
                window.location.href = 'https://music.youtube.com';
                return; // aşağıdaki kodlar çalışmasın
            }

            // sayfa yüklendikten sonra çalışacak işlemler
            setTimeout(() => {
                // burada bir şey yapabilirsin
            }, 1000);

            window.navigation.addEventListener('navigate', () => this.onChangePage());
        },
        stop() {
            this.popupObserver?.disconnect();
        },
        cleanup() {
            this.songElement = null;
            this.songElements = [];

            document.removeEventListener('keydown', this.keydownEvent);
            document.removeEventListener('keyup', this.keyupEvent);

            this.songListenerMap?.forEach((handler, song) => {
                song.removeEventListener('click', handler);
            });
        
        },
        popup(){

            return document.querySelector
            ('ytmusic-menu-popup-renderer #items') as HTMLElement;    

        },
        onChangePage() {
            if (this.waiting) {
                return;
            } else {
                this.waiting = true;
            }

            console.log('changed');

            this.observer = new MutationObserver(() => {
                this.cleanup();
                this.settShortCuts();
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            }); 
            this.waiting = false;
        },
        settShortCuts() {
            const itemTypes = [responsiveItem, thumbnailItem,queueItem];
            itemTypes.forEach((query) => {
                const elements = document.querySelectorAll(query);
                elements.forEach((el) => {
                    const element = el as HTMLElement;
                    const hasButton = element.
                        querySelector(buttonSelector);
                    if (hasButton) this.songElements.push(element);
                });
            });
            document.addEventListener('keydown', this.keydownEvent);
            document.addEventListener('keyup', this.keyupEvent);

            this.songListenerMap = new Map(); 
            this.songElements.forEach((song) => {
                const newHandler = () => this.songClickEvent(song);
                song.addEventListener('click', newHandler);
                this.songListenerMap!.set(song, newHandler);
            });
        },
        songClickEvent(song: HTMLElement) { 
            const button = song.querySelector
                ('#button-shape button') as HTMLButtonElement;
            console.log(this.key);
                if(this.key){
                    button.click();
                    this.setupPopupObserver(); 
                }
        },
        setupPopupObserver() {
            this.popupObserver?.disconnect();

            const observer = new MutationObserver
                (() => {
                    this.popupObserver?.disconnect();
                    this.popupClicker(); 
                });

            this.popupObserver = observer;

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },

        popupClicker() {
            console.log('popupclicked');
            
            if (!this.popup()) return;

            this.popup()!.style.display = 'none';
            const operationStr = shortCuts
            [this.key as keyof typeof shortCuts];

            const length = this.popup()!.children.length;
            for (let i = 0; i < length; i++) {

                const item = this.popup()!.children[i];
                const strTag = item.querySelector
                    ('yt-formatted-string') as HTMLElement;
                
                if (strTag.innerHTML == operationStr) {
                    setTimeout(() => {
                        (item as HTMLElement).click();
                        this.popup()!.style.display = 'block';
                        setTimeout(() => {

                        }, 100);
                    }, 50);
                    break;
                }
            };
        },
        keydownEvent(e: KeyboardEvent) {
            if (Object.keys(shortCuts).includes(e.key)) {
            this.key = e.key; }
        },
        keyupEvent(e: KeyboardEvent) { this.key = null; },

    },
});
