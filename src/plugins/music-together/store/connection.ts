import { createSignal } from 'solid-js';

import { Connection } from '../connection';

export const [connection, setConnection] = createSignal<Connection | null>(
  null,
);
