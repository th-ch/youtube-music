import { Actions, triggerAction } from '../utils';

export const CHANNEL = 'navigation';
export const ACTIONS = Actions;

export function goToNextPage() {
  triggerAction(CHANNEL, Actions.NEXT);
}
// for HTML
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
(global as any).goToNextPage = goToNextPage;

export function goToPreviousPage() {
  triggerAction(CHANNEL, Actions.BACK);
}
// for HTML
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
(global as any).goToPreviousPage = goToPreviousPage;

export default {
  CHANNEL,
  ACTIONS,
  actions: {
    goToNextPage,
    goToPreviousPage,
  },
};
