import { createContext, JSX, splitProps, useContext } from 'solid-js';

import { MusicTogetherConfig } from '../types';

import { RendererContext } from '@/types/contexts';

export type RendererContextContextType = {
  context: RendererContext<MusicTogetherConfig>;
};
export const RendererContextContext =
  createContext<RendererContextContextType>();

export type RendererContextProviderProps = RendererContextContextType & {
  children: JSX.Element;
};
export const RendererContextProvider = (
  props: RendererContextProviderProps,
) => {
  const [local, left] = splitProps(props, ['children']);
  return (
    <RendererContextContext.Provider value={left}>
      {local.children}
    </RendererContextContext.Provider>
  );
};
export const useRendererContext = () => {
  const context = useContext(RendererContextContext);
  if (!context) throw Error('RendererContextProvider not found');

  return context.context;
};
