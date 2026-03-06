import React, { useEffect, useState } from 'react';
import { useGamingWalletStore } from '../store/gamingWalletStore';

type NetworkHealth = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

interface NetworkStatusState {
  health: NetworkHealth;
  latency: number;
  lastChecked: Date;
}

const HEALTH_COLOR: Record<NetworkHealth, string> = {
  excellent: '#00ff88',
  good: '#00d9ff',
  fair: '#ffa500',
  poor: '#ff6b6b',
  offline: '#666',
};

const HEALTH_LABEL: Record<NetworkHealth, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  offline: 'Offline',
};

const NetworkStatus: React.FC = () => {
  const { wallet } = useGamingWalletStore();
  const [status, setStatus] = useState<NetworkStatusState>({
    health: 'good',
    latency: 0,
    lastChecked: new Date(),
  });

  useEffect(() => {
    if (!wallet?.isConnected) {
      setStatus({ health: 'offline', latency: 0, lastChecked: new Date() });
      return;
    }

    const checkNetworkHealth = async () => {
      const start = Date.now();

      // In production, this would make actual RPC calls
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));

      const latency = Date.now() - start;
      let health: NetworkHealth;

      if (latency < 100) health = 'excellent';
      else if (latency < 200) health = 'good';
      else if (latency < 500) health = 'fair';
      else health = 'poor';

      setStatus({ health, latency, lastChecked: new Date() });
    };

    checkNetworkHealth();
    const interval = setInterval(checkNetworkHealth, 10000);

    return () => clearInterval(interval);
  }, [wallet?.isConnected]);

  const color = HEALTH_COLOR[status.health];

  return (
    <div style={styles.container}>
      <div style={styles.indicator}>
        <div
          className="pulse-animation"
          style={{ ...styles.dot, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
        <span style={styles.label}>Network: {HEALTH_LABEL[status.health]}</span>
      </div>
      {wallet?.isConnected && status.latency > 0 && (
        <span style={styles.latency}>{status.latency}ms</span>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.8rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '6px',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  label: {
    color: '#ffffff',
    fontSize: '0.85rem',
  },
  latency: {
    color: '#a0a0a0',
    fontSize: '0.75rem',
  },
};

export default NetworkStatus;
