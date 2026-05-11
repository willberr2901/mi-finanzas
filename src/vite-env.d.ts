/// <reference types="vite/client" />

declare module 'virtual:pwa-register/react' {
  import { useState } from 'react';
  
  export interface RegisterSWOptions {
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration) => void;
    onRegisterError?: (error: Error) => void;
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    offlineReady: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    updateServiceWorker: (reloadPage?: boolean) => void;
  };
}