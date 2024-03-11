import prompt from 'custom-electron-prompt';

import { BrowserWindow } from 'electron';

import { createPlugin } from '@/utils';

import promptOptions from '@/providers/prompt-options';

import { getServerInstance } from '@/plugins/web-srv/server';



type Modifiers = (
  | Electron.MouseInputEvent
  | Electron.MouseWheelInputEvent
  | Electron.KeyboardInputEvent
  )['modifiers'];
export const pressKey = (
  window: BrowserWindow,
  key: string,
  modifiers: Modifiers = [],
) => {
  window.webContents.sendInputEvent({
    type: 'keyDown',
    modifiers,
    keyCode: key,
  });
};

interface WebSrvConfig {
  /**
   * Whether to enable the web server.
   * @default true
   */
  enabled: boolean;

  /**
   * The port to use for the web server.
   */
  port: string | null;
}


export default createPlugin({
  name: ()=>'Web Server',
  description: () => 'In built web server for external control and information gathering',
  restartNeeded: false, // if value is true, ytmusic show restart dialog
  config: {
    enabled: false,
    port: '8888',
    // responseWebServerAddress: '127.0.0.1:7474',
  } as WebSrvConfig,

  menu: async ({ getConfig, setConfig }) => {
    // All *Config methods are wrapped Promise<T>
    let config = await getConfig();
    return [
      {
        label: 'Set Port',
        type: 'normal',
          async click() {
            const port: string | null = await portPrompt(config.port);
            setConfig({ port: port?port:config.port });
            config = await getConfig();
          },
      },
    ];
  },
  backend: {
    async start(
      { ipc,
        getConfig,
        window
      }
    ) {

     // const clickTasks: Array<string> = [];
     const server = getServerInstance();
     const config = await getConfig();
     server.port = Number(config.port);
      let songQueue: string[] = [];

     ipc.on('web-srv:queueUpdate', (queue: string[])=>{
       songQueue = queue;
     });

      server.app.get('/play', (req, res) => {
        const name = req.header('name');
        const force = req.header('force');
        console.log(name);
        ipc.send('web-srv:play', name, force, false);
        res.statusCode = 200;
        res.send('Success');
      });


      server.app.get('/video', (req, res) => {
        const name = req.header('name');
        const force = req.header('force');
        console.log(name);
        ipc.send('web-srv:play', name, force, true);
        res.statusCode = 200;
        res.send('Success');
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      server.app.get('/lastAdded', (req, res) => {
        res.statusCode = 200;
        res.send(songQueue.at(songQueue.length-1));
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      server.app.get('/queue', (req, res) => {
        res.statusCode = 200;
        res.send(songQueue.join('\n'));
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      server.app.get('/playPause', (req, res)=>{
        res.statusCode=200;
        pressKey(window, ';');
        res.send('Success');
      });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      server.app.get('/playPrevious', (req, res) => {
        res.statusCode = 200;
        pressKey(window, 'k');
        res.send('Success');
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      server.app.get('/playNext', (req, res) => {
        res.statusCode = 200;
        pressKey(window, 'j');
        res.send('Success');
      });


      // you can communicate with renderer plugin

      if(config.enabled){
        server.start();
      }

    },
    // it fired when config changed
    onConfigChange(config) {
      getServerInstance().port = Number(config.port);
      getServerInstance().stop();
      getServerInstance().start();
      /* ... */
      },
    // // it fired when plugin disabled
    stop() {
      getServerInstance().stop();
    },
  },
  renderer: {
    start({ ipc }) {

      console.log('render');
      const observer = new MutationObserver(() => {
        const queue:string[] = [];
        for(const val of (((document.querySelector('ytmusic-tab-renderer') as HTMLElement).querySelector('ytmusic-player-queue') as HTMLElement)
          .querySelector('div[id="contents"]') as HTMLElement).children){
          const item = val.querySelectorAll('yt-formatted-string');
          queue.push(`${item[0].textContent} - ${item[1].textContent}`);
        }
        // console.log(queue);
        ipc.send('web-srv:queueUpdate', queue);
      });

      observer.observe(document.querySelector('ytmusic-player-queue') as HTMLElement, {
        childList: true,
        subtree: true
      });


      ipc.on('web-srv:play', async (s:string, f: string, video: boolean)=>{
        let force = false;
        if(!s)return;
        if(f && f == 'true') force = true;

        console.log(force);
        const searchBox = document.querySelector('ytmusic-search-box') as HTMLElement;
        (searchBox.querySelector('input[id="input"]') as HTMLInputElement).value = s;
        searchBox.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
        console.log('1');
        await waitForElm('ytmusic-tabbed-search-results-renderer', true, null);

        setTimeout(()=>{
          console.log('2');
          const val = document.querySelectorAll('ytmusic-shelf-renderer');
          console.log('3');
          let firstItem;
          for(firstItem of val){
            if(firstItem.outerHTML.includes(`>${video?'Videos':'Songs'}<`))
              break;
          }
          console.log('4');
          if(!firstItem)return;
          console.log('5');
          console.log(firstItem);
          firstItem = (firstItem.querySelector('div[id="contents"]') as HTMLElement );
          console.log(firstItem);
          firstItem = firstItem.querySelector('ytmusic-responsive-list-item-renderer') as HTMLElement;
          const link = (firstItem.querySelector('a') as HTMLAnchorElement);
          if(force) {
            setTimeout(()=> {
              link.click();
            }, 500);
            return;
            }

          (firstItem.querySelector('button[aria-label="Action menu"]') as HTMLButtonElement).click();
          setTimeout(()=>{
            const childNodes = ((document.querySelector('ytmusic-menu-popup-renderer') as HTMLElement)
              .querySelector('tp-yt-paper-listbox') as HTMLElement).children;
            let child;
            for(child of childNodes){
              if(child.outerHTML.includes('Add to queue'))
                break;
            }
            (child as HTMLElement).click();
            (document.querySelector('tp-yt-paper-icon-button[aria-label="Open player page"]') as HTMLElement).click();
          }, 500);
        }, 1000);
      });
    },
    // Only renderer available hook
    onPlayerApiReady() {
      // set plugin config easily
      console.log('renderapi');
    },
    // onConfigChange(newConfig) { /* ... */ },
    // stop(_context) { /* ... */ },
  },
});

async function portPrompt(port: string | null): Promise<string | null> {
  return await prompt(
    {
      title: 'Set Port',
      label: 'Set Port',
      value: 'Enter the port',
      type: 'input',
      inputAttrs: {
        type: 'number',
        placeholder: `current port: ${port?port:''}`,
      },
      width: 450,
      ...promptOptions(),
    }
  );
}

function waitForElm(selector:string, waitForChanges:boolean, bodyToObserve: string | null) {
  return new Promise((resolve) => {
    if (document.querySelector(selector) && !waitForChanges) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(bodyToObserve?document.querySelector(bodyToObserve) as HTMLElement : document.body, {
      childList: true,
      subtree: true
    });
  });
}
