import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export type AlertSeverity = 'critical' | 'high' | 'moderate' | 'low';

export type Alert = {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  locations: string[];
  time: string;
  timestamp: string;
  callToAction?: string;
};

type AlertsContextType = {
  alerts: Alert[];
  connected: boolean;
  clearAlert: (id: string) => void;
};

const WS_URL = 'ws://localhost:8086/ws';
const RECONNECT_DELAY = 3000;

const AlertsContext = createContext<AlertsContextType>({
  alerts: [],
  connected: false,
  clearAlert: () => {},
});

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const connect = useCallback(() => {
    if (!isMounted.current) return;

    console.log('[AeroSafe] Connecting to alerts WebSocket...');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[AeroSafe] ✓ WebSocket connected');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const alert: Alert = JSON.parse(event.data);
        console.log(`[AeroSafe] 📣 Alert received: ${alert.title} (${alert.severity})`);
        setAlerts(prev => [alert, ...prev].slice(0, 100)); // keep last 100
      } catch (e) {
        console.warn('[AeroSafe] Failed to parse alert:', event.data);
      }
    };

    ws.onclose = () => {
      console.log('[AeroSafe] WebSocket disconnected — reconnecting in 3s...');
      setConnected(false);
      if (isMounted.current) {
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      }
    };

    ws.onerror = (e) => {
      console.warn('[AeroSafe] WebSocket error:', e);
    };
  }, []);

  useEffect(() => {
    isMounted.current = true;
    connect();
    return () => {
      isMounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const clearAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  return React.createElement(
    AlertsContext.Provider,
    { value: { alerts, connected, clearAlert } },
    children,
  );
}

export function useAlerts(): AlertsContextType {
  return useContext(AlertsContext);
}