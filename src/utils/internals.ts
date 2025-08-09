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
  | 'CLIENT_NAME_TOKEN'
  | 'DEFAULT_STORE_EXPIRATION_TOKEN'
  | 'SCHEDULER_TOKEN'
  | 'WATCH_PLAYER_PROMISE_TOKEN'
  | 'MODULE_REGISTRY_TOKEN'
  | 'PERSISTENT_STORE_PROMISE_ACCESSOR_TOKEN'
  | 'PERSISTENT_ENTITY_STORE_ACCESSOR_TOKEN'
  | 'ENDPOINT_MAP'
  | 'SCREEN_MANAGER_TOKEN'
  | 'DOWNLOAD_UPLIFT_SERVICE_TOKEN'
  | 'ACTIVITY_TOKEN'
  | 'ACTION_ROUTER_TOKEN'
  | 'DOWNLOAD_ELIGIBILITY_PROMISE_TOKEN'
  | 'PREF_STORAGE_PROMISE_TOKEN'
  | 'DOWNLOADS_ENTITY_TYPE_MAP'
  | 'DIALOG_CONTROLLER_TOKEN'
  | 'PANEL_LOADING_STRATEGY_TOKEN'
  | 'SHEET_CONTROLLER_TOKEN'
  | 'APP_DIRECTION_TOKEN'
  | 'ICON_SET_TOKEN'
  | 'ICON_MANAGER_TOKEN'
  | 'PREFETCH_ICONS_TOKEN'
  | 'DOWNLOAD_UPLIFT_COMPLETION_PROMISE_TOKEN'
  | 'LOCAL_INNERTUBE_SERVICE_MAP_TOKEN'
  | 'LOCAL_INNERTUBE_ROUTER_TOKEN'
  | 'NETWORK_MANAGER_TOKEN'
  | 'VOTING_ANIMATION_CONTROLLER_TOKEN'
  | 'INNERTUBE_TOKEN_SERVICE'
  | 'ENTITIES_RESPONSE_PROCESSOR_TOKEN'
  | 'INNERTUBE_TRANSPORT_TOKEN'
  | 'ICON_WIZ_COMPONENT_TOKEN'
  | 'BUTTON_RENDERER_TOKEN'
  | 'TOAST_MANAGER_TOKEN'
  | 'POPUP_CONTROLLER_TOKEN'
  | 'PANEL_CONTROLLER_TOKEN'
  | 'APP_STORE_TOKEN'
  | 'VISIBILITY_OBSERVER'
  | 'PLAYER_API_TOKEN'
  | 'NAVIGATION_PROGRESS_TOKEN'
  | (string & {});

// TODO: Document all other services here
type InjectedService = {
  PLAYER_API_TOKEN: YoutubePlayer;
  WATCH_PLAYER_PROMISE_TOKEN: YoutubePlayer;

  TOAST_MANAGER_TOKEN: {
    currentPersistentToast: unknown;
    currentToast: unknown;
    queue: unknown[];

    enqueue(a: unknown, b: unknown): void;
  };

  APP_STORE_TOKEN: {
    // TODO: Write types for all members
    store: Store<{
      castStatus: unknown;
      collabInviteLink: unknown;
      continuation: unknown;
      download: unknown;
      entities: unknown;
      home: unknown;
      likeStatus: unknown;
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
  };

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
  };

  SCREEN_MANAGER_TOKEN: {
    backHistoryStack: { csn: string; key: string; rootVe: number }[];
    forwardHistoryStack: { csn: string; key: string; rootVe: number }[];
    recurringGrafts: Map<number, Map<unknown, unknown>>;
    graftQueue: unknown[];
    stateChangedQueue: unknown[];
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
  };

  PANEL_CONTROLLER_TOKEN: {
    panelContentMap: Map<unknown, unknown>;
    panelMap: Map<unknown, unknown>;
    pendingPanelResolvers: Map<unknown, unknown>;
    updatePanelContinuationDatas: Map<unknown, unknown>;
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
