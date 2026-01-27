import { Response } from 'express';
import { error } from '../client';
import { conversationQueries, userQueries } from '../lib/database';

export interface UserConversationResult {
  conversation: any;
  user: any;
}

/**
 * Get or create active conversation and fetch user data
 * @param userId - User's wallet address
 * @param res - Express response object for error handling
 * @returns User and conversation objects if successful, null if failed (response already sent)
 */
export async function getUserAndConversation(
  userId: string,
  res: Response
): Promise<UserConversationResult | null> {
  // Get or create active conversation
  let conversation = await conversationQueries.findActive(userId);
  if (!conversation) {
    conversation = await conversationQueries.create(userId);
  }

  // Get user wallet address
  const user = await userQueries.findByAddress(userId);
  if (!user) {
    error(res, 'User not found', 404);
    return null;
  }

  return { conversation, user };
}
