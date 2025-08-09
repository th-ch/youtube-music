import { YoutubePlayer } from '@/types/youtube-player';
import type { Store } from 'redux';

export const YTMD_INTERNALS_CONSTANT =
  '__YTMD_INTERNALS_DO_NOT_TOUCH_OTHERWISE_YOU_DIE__';

export type InjectionToken =
  | 'NETWORK_TOKEN'
  | 'KEY_MANAGER_TOKEN'
  | 'GFEEDBACK_TOKEN'
  | 'ENDPOINT_HANDLER_TOKEN'
  | 'COMMAND_HANDLER_TOKEN'
  | 'SCHEDULER_TOKEN'
  | 'WATCH_PLAYER_PROMISE_TOKEN'
  | 'MODULE_REGISTRY_TOKEN'
  | 'SCREEN_MANAGER_TOKEN'
  | 'ACTIVITY_TOKEN'
  | 'ACTION_ROUTER_TOKEN'
  | 'DOWNLOAD_ELIGIBILITY_PROMISE_TOKEN'
  | 'DIALOG_CONTROLLER_TOKEN'
  | 'SHEET_CONTROLLER_TOKEN'
  | 'NETWORK_MANAGER_TOKEN'
  | 'TOAST_MANAGER_TOKEN'
  | 'POPUP_CONTROLLER_TOKEN'
  | 'PANEL_CONTROLLER_TOKEN'
  | 'APP_STORE_TOKEN'
  | 'PLAYER_API_TOKEN'
  | 'NAVIGATION_PROGRESS_TOKEN'
  | (string & {});

// TODO: Document all other services here
type InjectedService = {
  PLAYER_API_TOKEN: YoutubePlayer;
  WATCH_PLAYER_PROMISE_TOKEN: YoutubePlayer;

  ACTIVITY_TOKEN: {
    eventJobIds: Record<number, unknown>;
    scrollEventsToIgnore: number;
    stopIgnoringScrollTimeoutIds: number[];
    onResize(): unknown;
    onScroll(a: unknown): unknown;
  };

  ACTION_ROUTER_TOKEN: {
    actionRoutingMap: Map<string, Map<number, CallableFunction>>;

    handleAction(action: unknown): unknown;
    triggerAction(action: unknown): unknown;
    triggerOptionalAction(action: unknown): unknown;
  };

  COMMAND_HANDLER_TOKEN: {
    buildCommandPayload(a: unknown, b: unknown): unknown;
    commandResolverMap: Record<string, CallableFunction>;
    handleServiceRequest(a: unknown): unknown;
    navigate(a: unknown): unknown;
    pendingCommands: Set<unknown>;
    sendAction(a: unknown): unknown;
  };

  DOWNLOAD_ELIGIBILITY_PROMISE_TOKEN: {
    isSupported: boolean;
  };

  ENDPOINT_HANDLER_TOKEN: {
    getUrl(a: unknown): unknown;
    getNavigationEventDetails(a: unknown, b: unknown): unknown;
  };

  TOAST_MANAGER_TOKEN: {
    currentPersistentToast: unknown;
    currentToast: unknown;
    queue: unknown[];

    enqueue(a: unknown, b: unknown): void;
  };

  APP_STORE_TOKEN: Store<{
    castStatus: {
      castAvailable: boolean;
      castConnectionData: {
        castConnectionState: 'DISCONNECTED' | 'CONNECTED';
        castReceiverName: string;
      };
      remoteWatchEndpoint: unknown;
    };
    collabInviteLink: { playlistId: string; inviteLinkURL: string };
    continuation: { continuationCommand: {} };
    download: { isLeaderTab: boolean };
    entities: Record<string, unknown> & {
      musicTrack: Record<
        string,
        {
          albumTitle: string;
          artistNames: string;
          contentRating: {};
          id: string;
          lengthMs: string;
          thumbnailDetails: {
            thumbnails: { url: string; width: number; height: number }[];
          };
          title: string;
          videoId: string;
        }
      >;
    };
    home: {
      shelfItems: Record<string, unknown>;
    };
    likeStatus: {
      playlists: Record<string, unknown>;
      videos: Record<string, unknown>;
    };
    multiSelect: unknown;
    navigation: unknown;
    player: unknown;
    playerPage: unknown;
    queue: unknown;
    radioButtonGroup: unknown;
    subscribeStatus: unknown;
    toggleStates: unknown;
    ui: unknown;
    uploads: unknown;
  }>;

  KEY_MANAGER_TOKEN: {
    /** Single key shortcuts */
    keyCombinationHandlers: Map<string, CallableFunction>;
    /** Sequencial shortcuts (vim-like) */
    keySequenceHandlers: Map<string[], CallableFunction>;
    mostRecentKeyboardEventInfo: {
      event: KeyboardEvent;
      invocationTime: number;
    };
    spacebarHandler: CallableFunction;

    isKeyBoardInUse(): boolean;
    keyboardEventMatchesKeys(a: unknown, b: unknown): boolean;
    register(a: unknown, b: unknown): unknown;
  };

  SCREEN_MANAGER_TOKEN: {
    backHistoryStack: { csn: string; key: string; rootVe: number }[];
    forwardHistoryStack: { csn: string; key: string; rootVe: number }[];
    recurringGrafts: Map<number, Map<unknown, unknown>>;
    graftQueue: unknown[];
    stateChangedQueue: unknown[];

    clickCommand(a: unknown, b: unknown, c: unknown): unknown;
    logStateChanged(a: unknown, b: unknown, c: unknown): unknown;

    setClient(a: unknown): unknown;
    stateChanged(a: unknown, b: unknown, c: unknown): unknown;
    visualElementStateChanged(a: unknown, b: unknown, c: unknown): unknown;
  };

  NETWORK_TOKEN: {
    clientName: 'WEB_REMIX';
    clientTheme: unknown;
    clientVersion: string;
    clientVersionIdentifier: string;

    innertubeClient: {
      isReady: () => boolean;
      buildSkeletonRequest: () => unknown;
    };

    fetch(a: unknown, b: unknown): unknown;
    fetchData(a: unknown, b: unknown): unknown;

    getRequestParams(a: unknown): unknown;
    handleResponse(a: unknown, b: unknown): unknown;
    postData(): unknown;
  };

  PANEL_CONTROLLER_TOKEN: {
    panelContentMap: Map<unknown, unknown>;
    panelMap: Map<unknown, unknown>;
    pendingPanelResolvers: Map<unknown, unknown>;
    updatePanelContinuationDatas: Map<unknown, unknown>;

    getPanelContent(panel: unknown): unknown;
    getReloadContinuation(a: unknown): unknown;
    hidePanel(panel: unknown): unknown;
    isVisible(a: unknown, b: unknown): boolean;

    showPanel(
      a: unknown,
      b: unknown,
      c: unknown,
      d: unknown,
      e: unknown,
      f: unknown,
      g: unknown,
    ): unknown;

    updatePanel(
      a: unknown,
      b: unknown,
      c: unknown,
      d: unknown,
      e: unknown,
      f: unknown,
    ): unknown;
  };

  SHEET_CONTROLLER_TOKEN: {
    container: unknown; // TODO: I think this is just POPUP_CONTROLLER_TOKEN.container

    closeSheet(): unknown;
    isSheetOpen(): boolean;
    openSheet(a: unknown, b: unknown): unknown;
  };

  DIALOG_CONTROLLER_TOKEN: {
    container: unknown; // TODO: I think this is just POPUP_CONTROLLER_TOKEN.container

    closeDialog(): unknown;
    isDialogOPen(): boolean;
    openDialog(a: unknown, b: unknown, c: unknown): unknown;
  };

  POPUP_CONTROLLER_TOKEN: {
    container: {
      actionMap: object;

      isDialogOpen(): boolean;
      isSheetOpen(): boolean;

      openDialog(a: unknown, b: unknown, c: unknown): unknown;
      openSheet(a: unknown, b: unknown): unknown;

      closeDialog(): void;
      closeSheet(): void;
      closePopup(a: unknown): void;
    };
  };

  GFEEDBACK_TOKEN: {
    chatSupportLoaded: false;
    recentlyPlayedVideoIds: string[];

    showFeedbackDialog(): void;
    showHelpDialog(a: unknown): void;
  };

  SCHEDULER_TOKEN: {
    start(): void;
    pause(): void;

    addLowPriorityJob(a: unknown, b: unknown): unknown;
    debounce(a: unknown, b: unknown, c: unknown): unknown;
    cancelJob(job: unknown): void;
  };
};

export const resolveToken = async <
  T extends InjectionToken,
  R = T extends keyof InjectedService ? InjectedService[T] : unknown,
>(
  token: T,
): Promise<R | undefined> => {
  const { container } = (globalThis as any)[YTMD_INTERNALS_CONSTANT] ?? {};
  if (!container) return undefined;

  const [injectionToken] =
    container.providers.entries().find(([key]: [any]) => key?.name === token) ??
    [];

  if (!injectionToken) return undefined;
  return await container.resolve(injectionToken);
};
