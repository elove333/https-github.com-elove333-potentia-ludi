import { Response } from 'express';
import { error } from '../client';
import { parseIntent, validateIntent, ParsedIntent } from '../services/intentParser';

/**
 * Parse and validate an intent, handling errors consistently
 * @param input - Natural language input to parse
 * @param res - Express response object for error handling
 * @returns Parsed intent if successful, null if failed (response already sent)
 */
export async function parseAndValidateIntent(
  input: string,
  res: Response
): Promise<ParsedIntent | null> {
  // Parse intent
  const parsed = await parseIntent(input);

  if (!parsed) {
    error(res, 'Could not understand input', 400);
    return null;
  }

  // Validate parsed intent
  const validation = validateIntent(parsed);
  if (!validation.valid) {
    error(res, `Invalid intent: ${validation.errors.join(', ')}`, 400);
    return null;
  }

  return parsed;
}
