# Webhook Endpoints Documentation

## Overview

This document describes the webhook endpoints for the Potentia-Ludi application, specifically designed for debugging and handling game event transfers.

## Endpoints

### 1. Game Event Transfer Webhook
**Endpoint:** `POST /api/webhooks/game-event-transfer`

**Purpose:** Receives and processes game event transfers from external systems.

#### Authentication
- **HMAC Signature Verification**: Required in production (via `x-signature` header)
- **Optional User Authentication**: Can be authenticated with session token

#### Rate Limiting
- **Limit**: 100 requests per minute per IP address

#### Request Headers
```
Content-Type: application/json
x-signature: <HMAC-SHA256 signature of request body>
```

#### Request Body
```json
{
  "eventType": "game_event_transfer",
  "walletAddress": "0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4",
  "data": {
    "gameId": "example-game",
    "amount": "100",
    "timestamp": "2024-02-07T00:00:00.000Z"
  }
}
```

**Required Fields:**
- `eventType` (string): Type of the game event
- `walletAddress` (string): Wallet address associated with the event

**Optional Fields:**
- `data` (object): Additional event data

#### Response
**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Webhook processed successfully",
    "eventType": "game_event_transfer",
    "walletAddress": "0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4",
    "timestamp": "2024-02-07T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid payload
- `401 Unauthorized`: Invalid signature
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Database or processing error

#### Security

**Signature Generation:**
```javascript
const crypto = require('crypto');

const payload = {
  eventType: "game_event_transfer",
  walletAddress: "0xAddress",
  data: { /* ... */ }
};

const signature = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');
```

**Example cURL Request:**
```bash
# Generate signature first
PAYLOAD='{"eventType":"game_event_transfer","walletAddress":"0xAddress","data":{}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

# Send request
curl -X POST http://localhost:3001/api/webhooks/game-event-transfer \
  -H "Content-Type: application/json" \
  -H "x-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

#### Logging

The endpoint provides comprehensive logging with emoji-coded messages:

- 🔗 **Connection**: Incoming webhook requests
- 📊 **Payload**: Payload validation and processing
- ✅ **Success**: Successful operations
- ❌ **Error**: Error messages with stack traces
- 💾 **Database**: Database operations

**Example Console Output:**
```
🔗 Incoming Webhook for Game Event
🔗 Webhook Triggered:  {
  "eventType": "game_event_transfer",
  "walletAddress": "0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4",
  "data": { ... }
}
✅ Webhook Validated
📊 Webhook Payload:  { ... }
✅ Webhook Payload Validated
💾 Saving Event to DB:  { eventType: 'game_event_transfer', walletAddress: '0x...', hasData: true }
✅ Event Saved:  { eventType: 'game_event_transfer', walletAddress: '0x...', timestamp: '...' }
```

---

### 2. Test Webhook Endpoint
**Endpoint:** `POST /api/webhooks/test`

**Purpose:** Simulates webhook requests for testing and debugging.

#### Rate Limiting
- **Limit**: 10 requests per minute per IP address

#### Request Body
```json
{
  "eventType": "test_event",
  "walletAddress": "0xTestAddress",
  "data": {
    "test": true
  }
}
```

All fields are optional. Default values will be used if not provided.

#### Response
**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Test Webhook Simulated",
    "testPayload": { ... },
    "webhookResponse": { ... },
    "webhookStatus": 200
  }
}
```

#### Example cURL Request:
```bash
curl -X POST http://localhost:3001/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "test_event",
    "walletAddress": "0xTestAddress"
  }'
```

---

## Environment Configuration

### Required Environment Variables

Add the following to your `.env` file:

```bash
# Webhook Secret for HMAC signature verification
# Generate with: openssl rand -hex 32
WEBHOOK_SECRET=your-secure-random-webhook-secret-key-min-32-chars-recommended
```

### Generating a Webhook Secret

**Using OpenSSL:**
```bash
openssl rand -hex 32
```

**Using Node.js:**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

---

## Database Storage

Webhook events are stored in the `audit_log` table via the telemetry system with the following structure:

```sql
{
  user_id: string | null,
  event_type: string,
  event_data: {
    walletAddress: string,
    data: object,
    source: 'webhook',
    timestamp: string
  },
  ip_address: string | null,
  user_agent: string | null
}
```

---

## Error Handling

The webhook endpoint implements comprehensive error handling:

1. **Signature Verification Errors**: Returns 401 with "Invalid Signature"
2. **Validation Errors**: Returns 400 with "Invalid Webhook Payload"
3. **Database Errors**: Returns 500 with detailed error message (logged but not exposed to client)
4. **Rate Limit Errors**: Returns 429 with retry-after information

All errors are logged with full stack traces for debugging:
```
❌ DB Save Error: <error message>
❌ Full DB Error Stack: <stack trace>
```

---

## Testing Workflow

### Local Testing
1. Set `WEBHOOK_SECRET` in your `.env` file
2. Start the API server: `npm run dev` or `node api/server.ts`
3. Use the test endpoint to simulate webhooks:
   ```bash
   curl -X POST http://localhost:3001/api/webhooks/test \
     -H "Content-Type: application/json" \
     -d '{"eventType":"test","walletAddress":"0xTest"}'
   ```

### Integration Testing
1. Generate a valid signature for your payload
2. Send a POST request to `/api/webhooks/game-event-transfer`
3. Verify the response and check logs for detailed processing information

### Unit Testing
Run the webhook tests:
```bash
npm test tests/webhook.test.ts
```

---

## Security Considerations

1. **Always use HTTPS** in production to prevent signature interception
2. **Rotate webhook secrets** periodically
3. **Monitor rate limit violations** for potential attacks
4. **Validate all input data** before processing
5. **Never log sensitive data** in production environments
6. **Keep WEBHOOK_SECRET confidential** - never commit to version control

---

## Troubleshooting

### Common Issues

**Issue:** "Invalid Webhook Signature" error
- **Solution**: Verify that the signature is correctly generated using the same secret and payload

**Issue:** "WEBHOOK_SECRET not configured" warning
- **Solution**: Add `WEBHOOK_SECRET` to your `.env` file

**Issue:** Rate limit exceeded
- **Solution**: Wait for the rate limit window to reset or adjust rate limits in the code

**Issue:** Database save errors
- **Solution**: Check database connection and ensure the `audit_log` table exists

### Debug Mode

For verbose logging, all webhook operations are logged with emoji-coded messages. Monitor your console output for detailed debugging information.

---

## Support

For issues or questions about the webhook implementation, please:
1. Check the console logs for detailed error information
2. Review this documentation
3. Open an issue on the GitHub repository
