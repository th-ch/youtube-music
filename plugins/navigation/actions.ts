import { Actions, triggerAction } from '../utils';

export const CHANNEL = 'navigation';
export const ACTIONS = Actions;

export function goToNextPage() {
  triggerAction(CHANNEL, Actions.NEXT);
}

export function goToPreviousPage() {
  triggerAction(CHANNEL, Actions.BACK);
}

export default {
  CHANNEL,
  ACTIONS,
  actions: {
    goToNextPage,
    goToPreviousPage,
  },
};
