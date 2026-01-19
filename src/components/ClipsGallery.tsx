import React, { useEffect, useState } from 'react';
import { useGamingWalletStore } from '../store/gamingWalletStore';
import { clipGeneratorService } from '../services/clipGenerator';
import { ClipMetadata } from '../types';

const ClipsGallery: React.FC = () => {
  const { clips } = useGamingWalletStore();
  const [localClips, setLocalClips] = useState<ClipMetadata[]>([]);
  const [selectedClip, setSelectedClip] = useState<ClipMetadata | null>(null);

  useEffect(() => {
    // Fetch clips from service
    const fetchClips = () => {
      const allClips = clipGeneratorService.getClips();
      setLocalClips(allClips);
    };

    fetchClips();
    const interval = setInterval(fetchClips, 5000);

    return () => clearInterval(interval);
  }, []);

  const allClips = [...clips, ...localClips];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadClip = (clip: ClipMetadata) => {
    // In production, this would download the actual video
    console.log('Downloading clip:', clip);
    alert(`Downloading clip: ${clip.id}`);
  };

  const shareClip = (clip: ClipMetadata) => {
    // In production, this would share to social media
    console.log('Sharing clip:', clip);
    alert(`Sharing clip: ${clip.id}`);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🎬 Clips & Stats</h2>

      {allClips.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No clips yet</p>
          <p style={styles.emptySubtext}>
            Record your gaming sessions to create clips with stats overlays
          </p>
        </div>
      ) : (
        <div style={styles.gallery}>
          {allClips.map((clip) => (
            <div
              key={clip.id}
              style={styles.clipCard}
              onClick={() => setSelectedClip(clip)}
            >
              <div style={styles.thumbnail}>
                <img
                  src={clip.thumbnailUrl}
                  alt={`${clip.gameId} clip`}
                  style={styles.thumbnailImage}
                />
                <div style={styles.duration}>{formatDuration(clip.duration)}</div>
              </div>
              
              <div style={styles.clipInfo}>
                <h4 style={styles.clipTitle}>{clip.gameId}</h4>
                <p style={styles.clipDate}>
                  {new Date(clip.timestamp).toLocaleDateString()}
                </p>
                
                <div style={styles.stats}>
                  <div style={styles.statItem}>
                    <span style={styles.statIcon}>⚡</span>
                    <span style={styles.statText}>{clip.stats.transactions} tx</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statIcon}>🏆</span>
                    <span style={styles.statText}>
                      {(clip.stats.winRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedClip && (
        <div style={styles.modal} onClick={() => setSelectedClip(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{selectedClip.gameId} Clip</h3>
              <button
                onClick={() => setSelectedClip(null)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <img
                src={clipGeneratorService.generateStatsOverlay(selectedClip.stats)}
                alt="Stats overlay"
                style={styles.statsOverlay}
              />

              <div style={styles.detailedStats}>
                <h4 style={styles.statsHeading}>Session Stats</h4>
                <div style={styles.statRow}>
                  <span>Play Time:</span>
                  <span>{formatDuration(selectedClip.stats.playTime)}</span>
                </div>
                <div style={styles.statRow}>
                  <span>Transactions:</span>
                  <span>{selectedClip.stats.transactions}</span>
                </div>
                <div style={styles.statRow}>
                  <span>Gas Spent:</span>
                  <span>
                    {(parseFloat(selectedClip.stats.gasSpent) / 1e18).toFixed(4)} ETH
                  </span>
                </div>
                <div style={styles.statRow}>
                  <span>Rewards Earned:</span>
                  <span>
                    {(parseFloat(selectedClip.stats.rewardsEarned) / 1e18).toFixed(2)}
                  </span>
                </div>
                <div style={styles.statRow}>
                  <span>Win Rate:</span>
                  <span>{(selectedClip.stats.winRate * 100).toFixed(1)}%</span>
                </div>
                <div style={styles.statRow}>
                  <span>Achievements:</span>
                  <span>{selectedClip.stats.achievements.length}</span>
                </div>
              </div>

              <div style={styles.actions}>
                <button
                  onClick={() => downloadClip(selectedClip)}
                  style={styles.actionButton}
                >
                  📥 Download
                </button>
                <button
                  onClick={() => shareClip(selectedClip)}
                  style={styles.actionButton}
                >
                  📤 Share
                </button>
              </div>
            </div>
          </div>
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
  gallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
    maxHeight: '500px',
    overflowY: 'auto' as const,
  },
  clipCard: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    border: '1px solid rgba(112, 0, 255, 0.2)',
  },
  thumbnail: {
    position: 'relative' as const,
    width: '100%',
    aspectRatio: '16/9',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  duration: {
    position: 'absolute' as const,
    bottom: '0.5rem',
    right: '0.5rem',
    padding: '0.2rem 0.5rem',
    background: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '4px',
    fontSize: '0.8rem',
  },
  clipInfo: {
    padding: '0.8rem',
  },
  clipTitle: {
    margin: '0 0 0.3rem 0',
    fontSize: '1rem',
    color: '#7000ff',
  },
  clipDate: {
    margin: '0 0 0.5rem 0',
    fontSize: '0.75rem',
    color: '#666',
  },
  stats: {
    display: 'flex',
    gap: '1rem',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  statIcon: {
    fontSize: '0.9rem',
  },
  statText: {
    fontSize: '0.8rem',
    color: '#a0a0a0',
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: '#1a1a2e',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '2px solid #7000ff',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderBottom: '1px solid rgba(112, 0, 255, 0.3)',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.3rem',
    color: '#7000ff',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
  },
  modalBody: {
    padding: '1rem',
  },
  statsOverlay: {
    width: '100%',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  detailedStats: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
  },
  statsHeading: {
    margin: '0 0 0.8rem 0',
    fontSize: '1.1rem',
    color: '#00d9ff',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.4rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '0.9rem',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
  },
  actionButton: {
    flex: 1,
    padding: '0.8rem',
    fontSize: '1rem',
    color: '#ffffff',
    background: 'linear-gradient(90deg, #00d9ff, #7000ff)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
  },
};

export default ClipsGallery;
