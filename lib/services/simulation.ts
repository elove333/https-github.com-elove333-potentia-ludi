// Tenderly simulation service
import axios from 'axios';
import { logger } from '@/lib/db/client';

export interface SimulationResult {
  success: boolean;
  gasUsed: string;
  logs: Array<{
    name?: string;
    inputs?: any[];
  }>;
  balanceChanges: Array<{
    address: string;
    token: string;
    amount: string;
  }>;
  revertReason?: string;
}

export async function simulateTransaction(
  chainId: number,
  from: string,
  to: string,
  data: string,
  value: string = '0'
): Promise<SimulationResult> {
  try {
    const apiKey = process.env.TENDERLY_API_KEY;
    const projectSlug = process.env.TENDERLY_PROJECT;
    const accountSlug = process.env.TENDERLY_ACCOUNT;

    if (!apiKey || !projectSlug || !accountSlug) {
      logger.warn('Tenderly not configured, skipping simulation');
      return {
        success: true,
        gasUsed: '0',
        logs: [],
        balanceChanges: [],
      };
    }

    const url = `https://api.tenderly.co/api/v1/account/${accountSlug}/project/${projectSlug}/simulate`;

    const response = await axios.post(
      url,
      {
        network_id: chainId.toString(),
        from,
        to,
        input: data,
        value,
        save: false,
        save_if_fails: true,
      },
      {
        headers: {
          'X-Access-Key': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const result = response.data.transaction;

    return {
      success: result.status === true,
      gasUsed: result.gas_used?.toString() || '0',
      logs: result.transaction_info?.logs || [],
      balanceChanges: result.transaction_info?.balance_diff || [],
      revertReason: result.error_message,
    };
  } catch (error) {
    logger.error({ error, from, to }, 'Error simulating transaction');
    throw new Error('Transaction simulation failed');
  }
}

export async function assessRisks(
  simulation: SimulationResult,
  expectedChanges: any
): Promise<Array<{ level: string; message: string }>> {
  const risks: Array<{ level: string; message: string }> = [];

  // Check simulation success
  if (!simulation.success) {
    risks.push({
      level: 'critical',
      message: simulation.revertReason || 'Transaction would revert',
    });
  }

  // Check for unexpected balance changes
  if (simulation.balanceChanges.length > expectedChanges.length + 2) {
    risks.push({
      level: 'high',
      message: 'Unexpected token transfers detected',
    });
  }

  // Check gas usage
  const gasUsed = BigInt(simulation.gasUsed);
  if (gasUsed > 500000n) {
    risks.push({
      level: 'medium',
      message: 'High gas usage detected',
    });
  }

  return risks;
}
