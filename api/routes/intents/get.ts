// API Route: GET /api/intents/:id
// Get intent details by ID

import { intentQueries } from '../../lib/database';

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
  try {
    const intentId = params.id;
    
    if (!intentId) {
      return new Response(
        JSON.stringify({ error: 'Missing intent ID' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const intent = await intentQueries.findById(intentId);
    
    if (!intent) {
      return new Response(
        JSON.stringify({ error: 'Intent not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify(intent),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error fetching intent:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch intent' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
