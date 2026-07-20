import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'wp_app_state';

interface AppState {
  isPaired: boolean;
  isConnected: boolean;
  targetIp: string;
  pairPort: string;
  connectPort: string;
}

interface AppContextType extends AppState {
  setTargetIp: (ip: string) => void;
  setPairPort: (port: string) => void;
  setConnectPort: (port: string) => void;
  markPaired: (ip: string, port: string) => void;
  markConnected: (ip: string, port: string) => void;
  disconnect: () => void;
}

const DEFAULT_STATE: AppState = {
  isPaired: false,
  isConnected: false,
  targetIp: '',
  pairPort: '',
  connectPort: '',
};

const AppContext = createContext<AppContextType>({
  ...DEFAULT_STATE,
  setTargetIp: () => {},
  setPairPort: () => {},
  setConnectPort: () => {},
  markPaired: () => {},
  markConnected: () => {},
  disconnect: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val) as Partial<AppState>;
          setState((prev) => ({ ...prev, ...parsed, isPaired: false, isConnected: false }));
        } catch {}
      }
    });
  }, []);

  const save = useCallback((next: AppState) => {
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setTargetIp = useCallback((targetIp: string) => {
    setState((prev) => { const next = { ...prev, targetIp }; save(next); return next; });
  }, [save]);

  const setPairPort = useCallback((pairPort: string) => {
    setState((prev) => { const next = { ...prev, pairPort }; save(next); return next; });
  }, [save]);

  const setConnectPort = useCallback((connectPort: string) => {
    setState((prev) => { const next = { ...prev, connectPort }; save(next); return next; });
  }, [save]);

  const markPaired = useCallback((ip: string, port: string) => {
    setState((prev) => {
      const next = { ...prev, isPaired: true, targetIp: ip, pairPort: port };
      save(next);
      return next;
    });
  }, [save]);

  const markConnected = useCallback((ip: string, port: string) => {
    setState((prev) => {
      const next = { ...prev, isConnected: true, targetIp: ip, connectPort: port };
      save(next);
      return next;
    });
  }, [save]);

  const disconnect = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, isPaired: false, isConnected: false };
      save(next);
      return next;
    });
  }, [save]);

  return (
    <AppContext.Provider value={{ ...state, setTargetIp, setPairPort, setConnectPort, markPaired, markConnected, disconnect }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
