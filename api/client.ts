// Example client for interacting with the Planner → Executor API
import { Intent, TransactionPreview, BuiltTransaction } from '../src/types/intents';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * API client for Planner → Executor pipeline
 */
export class PlannerExecutorClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Submit natural language intent for processing
   */
  async submitIntent(
    input: string,
    address: string,
    chainId?: number
  ): Promise<{
    ok: boolean;
    intentId: string;
    intent: Intent;
    status: string;
    preview?: TransactionPreview;
  }> {
    const response = await fetch(`${this.baseUrl}/api/intents/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input, address, chainId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit intent');
    }

    return response.json();
  }

  /**
   * Get intent details by ID
   */
  async getIntent(intentId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/intents/${intentId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch intent');
    }

    return response.json();
  }

  /**
   * Build transaction after user confirms preview
   */
  async buildTransaction(intentId: string): Promise<{
    ok: boolean;
    intentId: string;
    transaction: BuiltTransaction;
  }> {
    const response = await fetch(`${this.baseUrl}/api/intents/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ intentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to build transaction');
    }

    return response.json();
  }

  /**
   * SIWE: Get nonce
   */
  async getNonce(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/siwe/nonce`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to get nonce');
    }

    const data = await response.json();
    return data.nonce;
  }

  /**
   * SIWE: Verify message and signature
   */
  async verifySignature(
    message: string,
    signature: string
  ): Promise<{
    ok: boolean;
    address: string;
    userId: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/siwe/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ message, signature }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Verification failed');
    }

    return response.json();
  }

  /**
   * SIWE: Logout
   */
  async logout(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/siwe/logout`, {
      method: 'POST',
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }
  }
}

// Example usage in a React component
export const useIntentSubmission = () => {
  const client = new PlannerExecutorClient();

  const submitIntent = async (input: string, address: string) => {
    try {
      // Submit intent
      const result = await client.submitIntent(input, address);
      
      console.log('Intent submitted:', result);
      console.log('Preview:', result.preview);

      // User reviews preview and confirms
      // ...

      // Build transaction
      const transaction = await client.buildTransaction(result.intentId);
      
      console.log('Transaction ready:', transaction.transaction);

      // Send to wallet for signing
      // const txHash = await sendTransaction(transaction.transaction);

      return { result, transaction };
    } catch (error) {
      console.error('Intent submission failed:', error);
      throw error;
    }
  };

  return { submitIntent };
};

// Example: React component using the API
/*
import { useState } from 'react';
import { PlannerExecutorClient } from './api/client';

export function IntentSubmitter({ address }: { address: string }) {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const client = new PlannerExecutorClient();

  const handleSubmit = async () => {
    if (!input || !address) return;

    setLoading(true);
    try {
      const result = await client.submitIntent(input, address);
      setPreview(result.preview);
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your intent (e.g., 'swap 100 USDC to ETH')"
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Processing...' : 'Submit'}
      </button>

      {preview && (
        <div>
          <h3>Preview</h3>
          <p>{preview.summary}</p>
          <div>
            <h4>Token Changes:</h4>
            {preview.tokenDeltas.map((delta, i) => (
              <div key={i}>
                {delta.direction === 'out' ? '-' : '+'} {delta.amount} {delta.symbol}
              </div>
            ))}
          </div>
          <div>
            <h4>Gas Cost:</h4>
            <p>{preview.gasCost.totalCostEth} ETH (${preview.gasCost.totalCostUsd})</p>
          </div>
          {preview.warnings && preview.warnings.length > 0 && (
            <div>
              <h4>Warnings:</h4>
              {preview.warnings.map((warning, i) => (
                <p key={i} style={{ color: 'orange' }}>{warning}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
*/
