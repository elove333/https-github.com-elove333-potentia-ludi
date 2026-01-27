import React, { useState } from 'react';
import { useGamingWalletStore } from '../store/gamingWalletStore';
import NetworkStatus from './NetworkStatus';

const WalletDashboard: React.FC = () => {
  const {
    wallet,
    setWallet,
    gasOptimizationEnabled,
    toggleGasOptimization,
    autoSwapEnabled,
    toggleAutoSwap,
  } = useGamingWalletStore();

  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // In production, this would use Web3 providers like wagmi/ethers
      // For demo, simulate wallet connection
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setWallet({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        balance: '1.5',
        isConnected: true,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
  };

  if (!wallet) {
    return (
      <div style={styles.container}>
        <h2 style={styles.heading}>💼 Wallet</h2>
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          style={styles.connectButton}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        <p style={styles.info}>Connect your wallet to start gaming</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>💼 Wallet</h2>
      
      <NetworkStatus />
      
      <div style={styles.walletInfo}>
        <div style={styles.infoRow}>
          <span style={styles.label}>Address:</span>
          <span style={styles.value}>
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
          </span>
        </div>
        
        <div style={styles.infoRow}>
          <span style={styles.label}>Balance:</span>
          <span style={styles.value}>{wallet.balance} ETH</span>
        </div>
        
        <div style={styles.infoRow}>
          <span style={styles.label}>Chain:</span>
          <span style={styles.value}>
            {wallet.chainId === 1 ? 'Ethereum' : `Chain ${wallet.chainId}`}
          </span>
        </div>
      </div>

      <div style={styles.features}>
        <div style={styles.feature}>
          <label style={styles.featureLabel}>
            <input
              type="checkbox"
              checked={gasOptimizationEnabled}
              onChange={toggleGasOptimization}
              style={styles.checkbox}
            />
            ⛽ Gas Optimization
          </label>
          {gasOptimizationEnabled && (
            <span style={styles.badge}>Active</span>
          )}
        </div>

        <div style={styles.feature}>
          <label style={styles.featureLabel}>
            <input
              type="checkbox"
              checked={autoSwapEnabled}
              onChange={toggleAutoSwap}
              style={styles.checkbox}
            />
            🔄 Auto Token Swap
          </label>
          {autoSwapEnabled && (
            <span style={styles.badge}>Active</span>
          )}
        </div>
      </div>

      <button onClick={disconnectWallet} style={styles.disconnectButton}>
        Disconnect
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: '0',
  },
  heading: {
    marginTop: 0,
    marginBottom: '1rem',
    fontSize: '1.5rem',
  },
  connectButton: {
    width: '100%',
    padding: '1rem',
    fontSize: '1.1rem',
    fontWeight: 'bold' as const,
    color: '#ffffff',
    background: 'linear-gradient(90deg, #00d9ff, #7000ff)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  disconnectButton: {
    width: '100%',
    padding: '0.8rem',
    marginTop: '1rem',
    fontSize: '1rem',
    color: '#ffffff',
    background: 'rgba(255, 0, 0, 0.3)',
    border: '1px solid rgba(255, 0, 0, 0.5)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  info: {
    marginTop: '1rem',
    textAlign: 'center' as const,
    color: '#a0a0a0',
    fontSize: '0.9rem',
  },
  walletInfo: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  label: {
    color: '#a0a0a0',
  },
  value: {
    color: '#00d9ff',
    fontWeight: 'bold' as const,
  },
  features: {
    marginTop: '1rem',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.8rem',
    marginBottom: '0.5rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
  },
  featureLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  badge: {
    padding: '0.2rem 0.6rem',
    background: '#00ff88',
    color: '#000',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 'bold' as const,
  },
};

export default WalletDashboard;
