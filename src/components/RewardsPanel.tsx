import React, { useEffect, useState } from 'react';
import { useGamingWalletStore } from '../store/gamingWalletStore';
import { rewardTrackingService } from '../services/rewardTracking';
import { ChainReward } from '../types';

const RewardsPanel: React.FC = () => {
  const { wallet, rewards, setRewards } = useGamingWalletStore();
  const [totalValue, setTotalValue] = useState(0);
  const [claimableCount, setClaimableCount] = useState(0);

  useEffect(() => {
    if (!wallet?.address) return;

    // Fetch rewards
    const fetchRewards = () => {
      const allRewards = rewardTrackingService.getAllRewards(wallet.address);
      setRewards(allRewards);
      
      const total = rewardTrackingService.getTotalRewardValue(wallet.address);
      setTotalValue(total);
      
      const claimable = rewardTrackingService.getClaimableRewards(wallet.address);
      setClaimableCount(claimable.length);
    };

    fetchRewards();
    const interval = setInterval(fetchRewards, 30000);

    return () => clearInterval(interval);
  }, [wallet?.address, setRewards]);

  const claimReward = async (reward: ChainReward) => {
    if (!wallet?.address) return;
    
    try {
      await rewardTrackingService.claimReward(wallet.address, reward);
      // Refresh rewards
      const allRewards = rewardTrackingService.getAllRewards(wallet.address);
      setRewards(allRewards);
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  if (!wallet) {
    return (
      <div style={styles.container}>
        <h2 style={styles.heading}>🏆 Rewards</h2>
        <p style={styles.info}>Connect wallet to track rewards</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🏆 Rewards</h2>

      <div style={styles.summary}>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Total Value</span>
          <span style={styles.statValue}>${totalValue.toFixed(2)}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Claimable</span>
          <span style={styles.statValue}>{claimableCount}</span>
        </div>
      </div>

      {rewards.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No rewards found yet</p>
          <p style={styles.emptySubtext}>Play games to earn rewards across chains</p>
        </div>
      ) : (
        <div style={styles.rewardsList}>
          {rewards.map((reward, index) => (
            <div key={`${reward.chainName}-${index}`} style={styles.rewardCard}>
              <div style={styles.rewardInfo}>
                <div style={styles.rewardHeader}>
                  <span style={styles.rewardToken}>{reward.tokenSymbol}</span>
                  <span style={styles.rewardChain}>{reward.chainName}</span>
                </div>
                <div style={styles.rewardAmount}>
                  {parseFloat(reward.amount).toFixed(4)} {reward.tokenSymbol}
                </div>
                <div style={styles.rewardUsd}>${reward.usdValue.toFixed(2)} USD</div>
              </div>
              
              {reward.claimable && (
                <button
                  onClick={() => claimReward(reward)}
                  style={styles.claimButton}
                >
                  Claim
                </button>
              )}
              
              {!reward.claimable && (
                <span style={styles.claimedBadge}>Claimed</span>
              )}
            </div>
          ))}
        </div>
      )}
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
  info: {
    color: '#a0a0a0',
    fontSize: '0.9rem',
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '1rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    textAlign: 'center' as const,
  },
  statLabel: {
    color: '#a0a0a0',
    fontSize: '0.85rem',
    marginBottom: '0.5rem',
  },
  statValue: {
    color: '#00ff88',
    fontSize: '1.5rem',
    fontWeight: 'bold' as const,
  },
  empty: {
    textAlign: 'center' as const,
    padding: '2rem 1rem',
  },
  emptyText: {
    color: '#a0a0a0',
    fontSize: '1rem',
    margin: '0 0 0.5rem 0',
  },
  emptySubtext: {
    color: '#666',
    fontSize: '0.85rem',
    margin: 0,
  },
  rewardsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.8rem',
    maxHeight: '400px',
    overflowY: 'auto' as const,
  },
  rewardCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    border: '1px solid rgba(0, 255, 136, 0.2)',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  rewardToken: {
    color: '#00ff88',
    fontWeight: 'bold' as const,
    fontSize: '1rem',
  },
  rewardChain: {
    color: '#a0a0a0',
    fontSize: '0.85rem',
  },
  rewardAmount: {
    color: '#ffffff',
    fontSize: '0.95rem',
    marginBottom: '0.3rem',
  },
  rewardUsd: {
    color: '#666',
    fontSize: '0.85rem',
  },
  claimButton: {
    padding: '0.6rem 1.2rem',
    fontSize: '0.9rem',
    color: '#000',
    background: '#00ff88',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    transition: 'transform 0.2s ease',
  },
  claimedBadge: {
    padding: '0.4rem 0.8rem',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#666',
    borderRadius: '6px',
    fontSize: '0.85rem',
  },
};

export default RewardsPanel;
