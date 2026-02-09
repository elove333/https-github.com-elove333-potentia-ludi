# Vercel API Integration Guide

This guide provides comprehensive documentation for integrating with the Vercel API, including authentication, access token management, and best practices for API usage.

## Table of Contents

- [Authentication](#authentication)
- [Creating Access Tokens](#creating-access-tokens)
- [Request Format](#request-format)
- [Response Format](#response-format)
- [Accessing Team Resources](#accessing-team-resources)
- [Error Handling](#error-handling)
- [Data Types](#data-types)
- [Pagination](#pagination)
- [Rate Limits](#rate-limits)
- [API Versioning](#api-versioning)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Authentication

Vercel Access Tokens are required to authenticate and use the Vercel API. All authenticated requests must include the `Authorization` header with a Bearer token:

```http
Authorization: Bearer <TOKEN>
```

### Failed Authentication

If authentication is unsuccessful for a request, the error status code **403** is returned.

## Creating Access Tokens

Access Tokens can be created and managed from inside your account settings.

### Step-by-Step Guide

1. **Navigate to Account Settings**
   - In the upper-right corner of your dashboard, click your profile picture
   - Select **Account Settings** or go to the [Tokens page](https://vercel.com/account/tokens) directly

2. **Access the Tokens Section**
   - Select **Tokens** from the sidebar

3. **Create a New Token**
   - From the **Create Token** section, enter a descriptive name for the token
   - Choose the scope from the list of Teams in the drop-down menu
     - The scope ensures that only your specified Team(s) can use an Access Token
   - From the drop-down, select an expiration date for the Token
   - Click **Create Token**

4. **Store the Token Securely**
   - Once you've created an Access Token, **securely store the value** as it will not be shown again
   - ⚠️ **Never commit tokens to version control**
   - Store tokens in environment variables (`.env.local` or secure secret management systems)

### Token Expiration

Setting an expiration date on an Access Token is highly recommended and is considered one of the standard security practices that helps keep your information secure.

**Available Expiration Options:**
- 1 day
- 7 days
- 30 days
- 60 days
- 90 days
- 1 year
- Custom date

You can view the expiration date of your Access Tokens on the [tokens page](https://vercel.com/account/tokens).

### Environment Variable Setup

After creating your token, add it to your environment configuration:

```bash
# .env.local
VERCEL_TOKEN=your_token_value_here
```

For CI/CD pipelines (GitHub Actions), add the token as a repository secret:
- Go to your repository Settings → Secrets and variables → Actions
- Click **New repository secret**
- Name: `VERCEL_TOKEN`
- Value: Your Vercel token

## Request Format

All requests to the Vercel API must be encoded as **JSON** with the `Content-Type: application/json` header.

### Example Request

```javascript
const axios = require('axios');

const config = {
  method: 'get',
  url: 'https://api.vercel.com/v9/projects',
  headers: {
    'Authorization': 'Bearer ' + process.env.VERCEL_TOKEN,
    'Content-Type': 'application/json'
  }
};

axios(config)
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

## Response Format

If not otherwise specified, responses from the Vercel API, including errors, are encoded exclusively as **JSON**.

### Success Response Structure

```json
{
  "projects": [...],
  "pagination": {
    "count": 20,
    "next": 1555072968396,
    "prev": 1555413045188
  }
}
```

### Error Response Structure

```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable error message"
  }
}
```

## Accessing Team Resources

By default, you can access resources contained within your own user account (personal).

To access resources owned by a team, or create a project for a specific team:

1. **Find the Team ID**
   - Navigate to your team settings in the Vercel dashboard
   - The Team ID is visible in the URL or team settings

2. **Append as Query Parameter**
   - Add `teamId` as a query string parameter to the API endpoint URL

### Example

```javascript
// Personal account resources
const personalUrl = 'https://api.vercel.com/v6/deployments';

// Team resources
const teamUrl = 'https://api.vercel.com/v6/deployments?teamId=team_abc123xyz';
```

## Error Handling

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 403 | `forbidden` | Authentication failed or insufficient permissions |
| 429 | `too_many_requests` | Rate limit exceeded |
| 400 | `bad_request` | Invalid request parameters |
| 404 | `not_found` | Resource not found |
| 500 | `internal_server_error` | Server error |

### Handling Errors in Code

```javascript
try {
  const response = await axios(config);
  return response.data;
} catch (error) {
  if (error.response) {
    // The request was made and server responded with error status
    const { code, message } = error.response.data.error;
    
    if (code === 'forbidden') {
      console.error('Authentication failed. Check your token.');
    } else if (code === 'too_many_requests') {
      console.error('Rate limit exceeded. Retry after:', error.response.headers['x-ratelimit-reset']);
    } else {
      console.error(`API Error [${code}]: ${message}`);
    }
  } else {
    console.error('Network error:', error.message);
  }
}
```

## Data Types

The following is a list of the types of data used within the Vercel API:

| Name | Definition | Example |
|------|------------|---------|
| **ID** | A unique value used to identify resources | `"V0fra8eEgQwEpFhYG2vTzC3K"` |
| **String** | A sequence of characters used to represent text | `"value"` |
| **Integer** | A number without decimals | `1234` |
| **Float** | A number with decimals | `12.34` |
| **Map** | A data structure with a list of values assigned to a unique key | `{ "key": "value" }` |
| **List** | A data structure with only a list of values separated by a comma | `["value", 1234, 12.34]` |
| **Enum** | A String with only a few possible valid values | `"A"` or `"B"` |
| **Date** | An Integer representing a date in milliseconds since the UNIX epoch | `1540095775941` |
| **IsoDate** | A String representing a date in the 8601 format | `"YYYY-MM-DDTHH:mm:ssZ"` |
| **Boolean** | A type of two possible values representing true or false | `true` or `false` |

## Pagination

When the API response includes an array of records, a pagination object is returned when the total number of records present is greater than the limit per request.

### Pagination Parameters

- **Default limit per request**: 20
- **Maximum possible limit**: 100
- Pass `limit` as a query parameter to change the number of results

### Pagination Object Structure

```json
{
  "pagination": {
    "count": 20,
    "next": 1555072968396,
    "prev": 1555413045188
  }
}
```

**Fields:**
- `count`: Amount of items in the current page
- `next`: Timestamp that must be used to request the next page (null if no more pages)
- `prev`: Timestamp that must be used to request the previous page

### Pagination Workflow

To obtain all records:

1. Send a request to the API endpoint
2. Include the query parameter `until` with a value equal to the timestamp value of `next` returned in the previous request
3. Repeat this sequence until the pagination object has a `next` value of `null`

### Example: Paginating Through All Projects

```javascript
const axios = require('axios');
const fs = require('fs');

const vercelToken = process.env.VERCEL_TOKEN;
const apiEndPt = 'https://api.vercel.com/v9/projects';

let config = {
  method: 'get',
  url: apiEndPt,
  headers: {
    'Authorization': 'Bearer ' + vercelToken,
  },
};

let results = [];

(function loop() {
  axios(config)
    .then(function (response) {
      results.push(...response.data.projects);
      
      if (response.data.pagination.next !== null) {
        // Request next page
        config.url = `${apiEndPt}?until=${response.data.pagination.next}`;
        loop();
      } else {
        // All pages retrieved
        console.log(`Retrieved ${results.length} projects`);
        fs.writeFileSync('projects.json', JSON.stringify(results, null, 2));
      }
    })
    .catch(function (error) {
      console.error('Error fetching projects:', error.message);
    });
})();
```

### Pagination with Custom Limit

```javascript
// Fetch 50 items per page instead of default 20
const url = 'https://api.vercel.com/v9/projects?limit=50';
```

## Rate Limits

We limit the number of calls you can make over a certain period of time. Rate limits vary and are specified by the following headers in all responses:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | The maximum number of requests that the consumer is permitted to make |
| `X-RateLimit-Remaining` | The number of requests remaining in the current rate limit window |
| `X-RateLimit-Reset` | The time at which the current rate limit window resets in UTC epoch seconds |

### Rate Limit Error Response

When the rate limit is exceeded, an error is returned with the status **429 Too Many Requests**:

```json
{
  "error": {
    "code": "too_many_requests",
    "message": "Rate limit exceeded"
  }
}
```

### Handling Rate Limits

```javascript
async function makeVercelRequest(config) {
  try {
    const response = await axios(config);
    
    // Log rate limit info
    const limit = response.headers['x-ratelimit-limit'];
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];
    
    console.log(`Rate Limit: ${remaining}/${limit} (resets at ${new Date(reset * 1000)})`);
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      const resetTime = error.response.headers['x-ratelimit-reset'];
      const waitTime = (resetTime * 1000) - Date.now();
      
      console.log(`Rate limit exceeded. Waiting ${waitTime}ms before retry...`);
      
      // Wait until rate limit resets
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Retry request
      return makeVercelRequest(config);
    }
    throw error;
  }
}
```

### Rate Limit Best Practices

1. **Monitor rate limit headers** in responses to track usage
2. **Implement exponential backoff** when approaching limits
3. **Cache responses** when possible to reduce API calls
4. **Use webhooks** instead of polling when available
5. **Batch operations** to minimize the number of requests

For complete rate limit information, see the [Vercel limits documentation](https://vercel.com/docs/limits).

## API Versioning

All endpoints and examples are designated with a specific version. **Versions vary per endpoint and are not global.**

### Version Format

Endpoint versions follow the base URL and come before the endpoint:

```
https://api.vercel.com/v6/deployments
                      ^^
                      Version number
```

### Version Stability

- The response shape of a certain endpoint is **not guaranteed to be fixed** over time
- Vercel might add new keys to responses without bumping a version endpoint
- Changes are noted in the [changelog](https://vercel.com/changelog)

### Best Practices for Versioning

1. **Read only needed keys** from responses
   ```javascript
   // ✅ Good: Only extract needed fields
   const { id, name, url } = response.data;
   
   // ❌ Bad: Proxy entire response without validation
   return response.data;
   ```

2. **Validate response structure** before using data
   ```javascript
   if (!response.data.projects || !Array.isArray(response.data.projects)) {
     throw new Error('Unexpected response structure');
   }
   ```

3. **Stay updated** with the changelog
4. **Handle deprecated endpoints** by planning migrations early

### Endpoint Version Examples

```javascript
// Deployments API - v6
const deploymentsUrl = 'https://api.vercel.com/v6/deployments';

// Projects API - v9
const projectsUrl = 'https://api.vercel.com/v9/projects';

// Domains API - v5
const domainsUrl = 'https://api.vercel.com/v5/domains';
```

### Deprecation Policy

- Old versions of each endpoint are supported for as long as possible
- When deprecation is intended, users are notified in the changelog
- Plan migrations well in advance when you see deprecation notices

## Best Practices

### Security

1. **Never commit tokens** to version control
   ```bash
   # Add to .gitignore
   .env.local
   .env*.local
   ```

2. **Use environment variables** for token storage
   ```javascript
   const token = process.env.VERCEL_TOKEN;
   if (!token) {
     throw new Error('VERCEL_TOKEN environment variable is required');
   }
   ```

3. **Rotate tokens regularly** (every 60-90 days recommended)

4. **Use shortest necessary expiration** for tokens

5. **Limit token scope** to specific teams when possible

### Error Handling

1. **Always handle errors** gracefully
2. **Log errors** for debugging
3. **Implement retry logic** for transient failures
4. **Provide user-friendly error messages**

### Performance

1. **Cache responses** when data doesn't change frequently
2. **Use pagination** to avoid large payloads
3. **Batch requests** when possible
4. **Monitor rate limits** to avoid throttling

### Code Organization

1. **Create reusable API client** functions
2. **Centralize configuration** (base URL, headers)
3. **Use TypeScript** for type safety
4. **Write tests** for API integrations

## Examples

### Example 1: Fetch All Projects

```javascript
const axios = require('axios');

async function getAllProjects() {
  const token = process.env.VERCEL_TOKEN;
  const baseUrl = 'https://api.vercel.com/v9/projects';
  
  let allProjects = [];
  let nextCursor = null;
  
  do {
    const url = nextCursor 
      ? `${baseUrl}?until=${nextCursor}`
      : baseUrl;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    allProjects.push(...response.data.projects);
    nextCursor = response.data.pagination.next;
    
  } while (nextCursor !== null);
  
  return allProjects;
}

// Usage
getAllProjects()
  .then(projects => {
    console.log(`Total projects: ${projects.length}`);
    projects.forEach(project => {
      console.log(`- ${project.name} (${project.id})`);
    });
  })
  .catch(error => console.error('Error:', error.message));
```

### Example 2: Create a Deployment

```javascript
const axios = require('axios');

async function createDeployment(projectName, files) {
  const token = process.env.VERCEL_TOKEN;
  
  const response = await axios.post(
    'https://api.vercel.com/v13/deployments',
    {
      name: projectName,
      files: files,
      projectSettings: {
        framework: 'nextjs',
      },
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data;
}

// Usage
createDeployment('my-project', [
  {
    file: 'index.html',
    data: Buffer.from('<h1>Hello World</h1>').toString('base64'),
  },
])
  .then(deployment => {
    console.log('Deployment created:', deployment.url);
  })
  .catch(error => console.error('Error:', error.message));
```

### Example 3: List Deployments with Team ID

```javascript
const axios = require('axios');

async function getTeamDeployments(teamId, limit = 20) {
  const token = process.env.VERCEL_TOKEN;
  
  const response = await axios.get(
    `https://api.vercel.com/v6/deployments?teamId=${teamId}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  return response.data.deployments;
}

// Usage
getTeamDeployments('team_abc123xyz')
  .then(deployments => {
    console.log(`Found ${deployments.length} deployments`);
    deployments.forEach(deployment => {
      console.log(`- ${deployment.name}: ${deployment.state}`);
    });
  })
  .catch(error => console.error('Error:', error.message));
```

### Example 4: API Client Class

```javascript
const axios = require('axios');

class VercelAPIClient {
  constructor(token) {
    this.token = token;
    this.baseUrl = 'https://api.vercel.com';
  }
  
  async request(method, endpoint, data = null, params = {}) {
    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      params,
    };
    
    if (data) {
      config.data = data;
    }
    
    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  handleError(error) {
    if (error.response) {
      const { code, message } = error.response.data.error || {};
      throw new Error(`Vercel API Error [${code}]: ${message}`);
    }
    throw error;
  }
  
  async getProjects(teamId = null) {
    const params = teamId ? { teamId } : {};
    return this.request('get', '/v9/projects', null, params);
  }
  
  async getDeployments(projectId, limit = 20) {
    return this.request('get', '/v6/deployments', null, { 
      projectId, 
      limit 
    });
  }
  
  async createDeployment(data) {
    return this.request('post', '/v13/deployments', data);
  }
}

// Usage
const client = new VercelAPIClient(process.env.VERCEL_TOKEN);

client.getProjects()
  .then(data => console.log('Projects:', data.projects))
  .catch(error => console.error('Error:', error.message));
```

## Additional Resources

- [Vercel API Documentation](https://vercel.com/docs/rest-api)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Limits Documentation](https://vercel.com/docs/limits)
- [Vercel Changelog](https://vercel.com/changelog)

## Support

If you encounter issues with the Vercel API:

1. Check the [Vercel Status Page](https://www.vercel-status.com/)
2. Review the [API Documentation](https://vercel.com/docs/rest-api)
3. Search [Vercel Discussions](https://github.com/vercel/vercel/discussions)
4. Contact [Vercel Support](https://vercel.com/support)

---

**Last Updated**: February 2026  
**Vercel API Version**: Various (v5-v13 depending on endpoint)
