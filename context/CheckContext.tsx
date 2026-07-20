import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'wp_check_state';

interface CheckContextType {
  isRunning: boolean;
  macList: string[];
  activeMacList: string[];
  sessionUrl: string;
  logs: string[];
  loopCount: number;
  sleepDelaySec: number;
  setSessionUrl: (url: string) => void;
  setLoopCount: (n: number) => void;
  setSleepDelaySec: (n: number) => void;
  addMac: (mac: string) => void;
  removeMac: (mac: string) => void;
  startCheck: () => void;
  stopCheck: () => void;
  clearLogs: () => void;
}

const CheckContext = createContext<CheckContextType>({
  isRunning: false,
  macList: [],
  activeMacList: [],
  sessionUrl: '',
  logs: [],
  loopCount: 12,
  sleepDelaySec: 8,
  setSessionUrl: () => {},
  setLoopCount: () => {},
  setSleepDelaySec: () => {},
  addMac: () => {},
  removeMac: () => {},
  startCheck: () => {},
  stopCheck: () => {},
  clearLogs: () => {},
});

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function ts() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export function CheckProvider({ children }: { children: React.ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [macList, setMacList] = useState<string[]>([]);
  const [activeMacList, setActiveMacList] = useState<string[]>([]);
  const [sessionUrl, setSessionUrlState] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [loopCount, setLoopCountState] = useState(12);
  const [sleepDelaySec, setSleepDelaySecState] = useState(8);

  const runningRef = useRef(false);
  const sessionUrlRef = useRef('');
  const loopCountRef = useRef(12);
  const sleepDelaySecRef = useRef(8);
  const macListRef = useRef<string[]>([]);

  useEffect(() => { sessionUrlRef.current = sessionUrl; }, [sessionUrl]);
  useEffect(() => { loopCountRef.current = loopCount; }, [loopCount]);
  useEffect(() => { sleepDelaySecRef.current = sleepDelaySec; }, [sleepDelaySec]);
  useEffect(() => { macListRef.current = macList; }, [macList]);

  // Load persisted settings
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try {
          const d = JSON.parse(val);
          if (d.macList) setMacList(d.macList);
          if (d.sessionUrl) setSessionUrlState(d.sessionUrl);
          if (d.loopCount) setLoopCountState(d.loopCount);
          if (d.sleepDelaySec) setSleepDelaySecState(d.sleepDelaySec);
        } catch {}
      }
    });
  }, []);

  const persist = useCallback((patch: object) => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      const current = val ? JSON.parse(val) : {};
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch })).catch(() => {});
    });
  }, []);

  const appendLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const setSessionUrl = useCallback((url: string) => {
    setSessionUrlState(url);
    persist({ sessionUrl: url });
  }, [persist]);

  const setLoopCount = useCallback((n: number) => {
    const v = clamp(n, 1, 200);
    setLoopCountState(v);
    persist({ loopCount: v });
  }, [persist]);

  const setSleepDelaySec = useCallback((n: number) => {
    const v = clamp(n, 1, 120);
    setSleepDelaySecState(v);
    persist({ sleepDelaySec: v });
  }, [persist]);

  const addMac = useCallback((mac: string) => {
    const trimmed = mac.trim().toUpperCase();
    if (!trimmed) return;
    setMacList((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      persist({ macList: next });
      return next;
    });
  }, [persist]);

  const removeMac = useCallback((mac: string) => {
    setMacList((prev) => {
      const next = prev.filter((m) => m !== mac);
      persist({ macList: next });
      return next;
    });
  }, [persist]);

  const startCheck = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);
    setLogs([]);
    setActiveMacList([...macListRef.current]);

    const run = async () => {
      const url = sessionUrlRef.current;
      const count = loopCountRef.current;
      const delay = sleepDelaySecRef.current * 1000;
      const macs = macListRef.current;

      appendLog(`[${ts()}] Session check started`);
      if (url) appendLog(`[${ts()}] URL: ${url}`);
      if (macs.length > 0) appendLog(`[${ts()}] MACs: ${macs.length} device(s)`);

      for (let i = 0; i < count; i++) {
        if (!runningRef.current) break;

        appendLog(`[${ts()}] — Loop ${i + 1}/${count}`);

        if (url) {
          try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(url, { method: 'GET', signal: controller.signal });
            clearTimeout(tid);
            appendLog(`[${ts()}] HTTP ${res.status} ${res.ok ? '✓ OK' : '✗ FAIL'}`);
          } catch (e: unknown) {
            const err = e as { name?: string; message?: string };
            if (err.name === 'AbortError') {
              appendLog(`[${ts()}] ✗ Timeout (10s)`);
            } else {
              appendLog(`[${ts()}] ✗ ${err.message ?? 'Network error'}`);
            }
          }
        } else {
          appendLog(`[${ts()}] ⚠ No session URL configured`);
        }

        if (runningRef.current && i < count - 1) {
          appendLog(`[${ts()}] Waiting ${sleepDelaySecRef.current}s...`);
          await new Promise<void>((r) => setTimeout(r, delay));
        }
      }

      runningRef.current = false;
      setIsRunning(false);
      appendLog(`[${ts()}] Check complete.`);
    };

    run();
  }, [appendLog]);

  const stopCheck = useCallback(() => {
    runningRef.current = false;
    appendLog(`[${ts()}] Stopped by user.`);
  }, [appendLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <CheckContext.Provider value={{
      isRunning, macList, activeMacList, sessionUrl, logs, loopCount, sleepDelaySec,
      setSessionUrl, setLoopCount, setSleepDelaySec,
      addMac, removeMac, startCheck, stopCheck, clearLogs,
    }}>
      {children}
    </CheckContext.Provider>
  );
}

export function useCheck() {
  return useContext(CheckContext);
}
