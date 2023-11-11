import Store from 'electron-store';
import { deepmerge } from 'deepmerge-ts';

import defaultConfig from './defaults';
import plugins from './plugins';
import store from './store';

import { restart } from '../providers/app-controls';

const set = (key: string, value: unknown) => {
  store.set(key, value);
};
const setPartial = (key: string, value: object) => {
  const newValue = deepmerge(store.get(key) ?? {}, value);
  console.log('sival', key, value, newValue);
  store.set(newValue);
};

function setMenuOption(key: string, value: unknown) {
  set(key, value);
  if (store.get('options.restartOnConfigChanges')) {
    restart();
  }
}

// MAGIC OF TYPESCRIPT

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]
type Join<K, P> = K extends string | number ?
  P extends string | number ?
    `${K}${'' extends P ? '' : '.'}${P}`
    : never : never;
type Paths<T, D extends number = 10> = [D] extends [never] ? never : T extends object ?
  { [K in keyof T]-?: K extends string | number ?
    `${K}` | Join<K, Paths<T[K], Prev[D]>>
    : never
  }[keyof T] : ''

type SplitKey<K> = K extends `${infer A}.${infer B}` ? [A, B] : [K, string];
type PathValue<T, K extends string> =
  SplitKey<K> extends [infer A extends keyof T, infer B extends string]
    ? PathValue<T[A], B>
    : T;
const get = <Key extends Paths<typeof defaultConfig>>(key: Key) => store.get(key) as PathValue<typeof defaultConfig, typeof key>;

export default {
  defaultConfig,
  get,
  set,
  setPartial,
  setMenuOption,
  edit: () => store.openInEditor(),
  watch(cb: Parameters<Store['onDidAnyChange']>[0]) {
    store.onDidAnyChange(cb);
  },
  plugins,
};
