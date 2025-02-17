import { createContext, JSX, useContext } from 'solid-js';

import { ToastService } from '@/types/queue';

export type ToastContextType = {
  service: ToastService;
};
export const ToastContext = createContext<ToastContextType>();

export type ToastProviderProps = ToastContextType & {
  children: JSX.Element;
};
export const ToastProvider = (props: ToastProviderProps) => (
  <ToastContext.Provider value={props}>{props.children}</ToastContext.Provider>
);
export const useToast = () => {
  const context = useContext(ToastContext);

  return (message: string) => {
    context?.service.show(message);
  };
};
