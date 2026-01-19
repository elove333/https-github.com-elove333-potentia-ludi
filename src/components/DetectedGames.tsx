import React, { useState } from 'react';
import { useGamingWalletStore } from '../store/gamingWalletStore';
import { clipGeneratorService } from '../services/clipGenerator';

const DetectedGames: React.FC = () => {
  const { detectedGames, addDetectedGame } = useGamingWalletStore();
  const [isAdding, setIsAdding] = useState(false);
  const [recordingGameId, setRecordingGameId] = useState<string | null>(null);

  const addCustomGame = () => {
    setIsAdding(true);
    // Simulate adding a custom game
    setTimeout(() => {
      addDetectedGame({
        id: `game-${Date.now()}`,
        name: 'Custom Game',
        url: window.location.href,
        chainId: 1,
        contractAddresses: [],
        detected: true,
        lastActive: new Date(),
      });
      setIsAdding(false);
    }, 500);
  };

  const toggleRecording = (gameId: string) => {
    const recordingState = clipGeneratorService.getRecordingState();
    
    if (recordingState.isRecording && recordingState.gameId === gameId) {
      // Stop recording
      clipGeneratorService.stopRecording();
      setRecordingGameId(null);
    } else {
      // Start recording
      clipGeneratorService.startRecording(gameId);
      setRecordingGameId(gameId);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>🎮 Detected Games</h2>
        <button onClick={addCustomGame} disabled={isAdding} style={styles.addButton}>
          {isAdding ? '+' : '+ Add'}
        </button>
      </div>

      {detectedGames.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No games detected yet</p>
          <p style={styles.emptySubtext}>
            Open a Web3 game to see it here automatically
          </p>
        </div>
      ) : (
        <div style={styles.gamesList}>
          {detectedGames.map((game) => {
            const isRecording = recordingGameId === game.id;
            return (
              <div key={game.id} style={styles.gameCard}>
                <div style={styles.gameInfo}>
                  <h3 style={styles.gameName}>{game.name}</h3>
                  <p style={styles.gameChain}>
                    Chain: {game.chainId === 1 ? 'Ethereum' : `Chain ${game.chainId}`}
                  </p>
                  <p style={styles.gameActivity}>
                    Last active: {new Date(game.lastActive).toLocaleTimeString()}
                  </p>
                </div>
                
                <button
                  onClick={() => toggleRecording(game.id)}
                  style={{
                    ...styles.recordButton,
                    ...(isRecording ? styles.recordButtonActive : {}),
                  }}
                >
                  {isRecording ? '⏹️ Stop' : '🔴 Record'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  heading: {
    marginTop: 0,
    marginBottom: 0,
    fontSize: '1.5rem',
  },
  addButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    color: '#ffffff',
    background: 'rgba(0, 217, 255, 0.3)',
    border: '1px solid #00d9ff',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
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
  gamesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.8rem',
  },
  gameCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    border: '1px solid rgba(0, 217, 255, 0.2)',
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    margin: '0 0 0.3rem 0',
    fontSize: '1.1rem',
    color: '#00d9ff',
  },
  gameChain: {
    margin: '0.2rem 0',
    fontSize: '0.85rem',
    color: '#a0a0a0',
  },
  gameActivity: {
    margin: '0.2rem 0',
    fontSize: '0.8rem',
    color: '#666',
  },
  recordButton: {
    padding: '0.6rem 1rem',
    fontSize: '0.9rem',
    color: '#ffffff',
    background: 'rgba(255, 0, 0, 0.3)',
    border: '1px solid rgba(255, 0, 0, 0.5)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  recordButtonActive: {
    background: 'rgba(255, 0, 0, 0.6)',
    animation: 'pulse 2s infinite',
  },
};

export default DetectedGames;
