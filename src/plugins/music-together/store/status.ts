import { createStore } from 'solid-js/store';

import { ConnectedState, Permission, User } from '../types';

// export const getDefaultProfile = (
//   connectionID: string,
//   id: string = Date.now().toString(36),
// ): User => {
//   const name = `Guest ${id.slice(-6)}`;
//
//   return {
//     id: connectionID,
//     handleId: `#music-together:${id}`,
//     name,
//     thumbnail: `https://ui-avatars.com/api/?name=${name}&background=random`,
//   };
// };

export type StatusStoreType = {
  mode: ConnectedState;
  permission: Permission;
  users: User[];
};
export const [status, setStatus] = createStore<StatusStoreType>({
  mode: 'disconnected',
  permission: 'all',
  users: [],
});
