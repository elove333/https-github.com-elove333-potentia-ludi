import React, { useEffect, useState } from 'react';
import { useGamingWalletStore } from '../store/gamingWalletStore';

type NetworkHealth = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

interface NetworkStatusState {
  health: NetworkHealth;
  latency: number;
  lastChecked: Date;
}

const NetworkStatus: React.FC = () => {
  const { wallet } = useGamingWalletStore();
  const [status, setStatus] = useState<NetworkStatusState>({
    health: 'good',
    latency: 0,
    lastChecked: new Date(),
  });

  useEffect(() => {
    if (!wallet?.isConnected) {
      setStatus({
        health: 'offline',
        latency: 0,
        lastChecked: new Date(),
      });
      return;
    }

    // Simulate network health check
    const checkNetworkHealth = async () => {
      const start = Date.now();
      
      // In production, this would make actual RPC calls
      // For demo, simulate network latency
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));
      
      const latency = Date.now() - start;
      let health: NetworkHealth;
      
      if (latency < 100) health = 'excellent';
      else if (latency < 200) health = 'good';
      else if (latency < 500) health = 'fair';
      else health = 'poor';
      
      setStatus({
        health,
        latency,
        lastChecked: new Date(),
      });
    };

    checkNetworkHealth();
    const interval = setInterval(checkNetworkHealth, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [wallet?.isConnected]);

  const getHealthColor = (health: NetworkHealth): string => {
    switch (health) {
      case 'excellent':
        return '#00ff88';
      case 'good':
        return '#00d9ff';
      case 'fair':
        return '#ffa500';
      case 'poor':
        return '#ff6b6b';
      case 'offline':
        return '#666';
      default:
        return '#666';
    }
  };

  const getHealthLabel = (health: NetworkHealth): string => {
    switch (health) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.indicator}>
        <div
          className="pulse-animation"
          style={{
            ...styles.dot,
            backgroundColor: getHealthColor(status.health),
            boxShadow: `0 0 8px ${getHealthColor(status.health)}`,
          }}
        />
        <span style={styles.label}>Network: {getHealthLabel(status.health)}</span>
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
