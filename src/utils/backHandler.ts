import { useEffect } from 'react';

type BackHandler = () => boolean;
const handlers: BackHandler[] = [];

export const registerBackHandler = (handler: BackHandler) => {
  handlers.push(handler);
};

export const unregisterBackHandler = (handler: BackHandler) => {
  const index = handlers.indexOf(handler);
  if (index !== -1) {
    handlers.splice(index, 1);
  }
};

export const executeBackAction = (): boolean => {
  // Execute the most recently added handler that returns true (indicating it handled the back action)
  for (let i = handlers.length - 1; i >= 0; i--) {
    if (handlers[i]()) {
      return true; // Action was handled
    }
  }
  return false; // Action was not handled
};

export const useHardwareBack = (handler: BackHandler, isActive: boolean) => {
  useEffect(() => {
    if (isActive) {
      registerBackHandler(handler);
      return () => unregisterBackHandler(handler);
    }
  }, [isActive, handler]);
};
