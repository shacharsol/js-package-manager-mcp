// Health check function for Netlify
exports.handler = async (event) => {
  // Import constants dynamically to avoid build issues with ES modules
  const { CORS_HEADERS, SERVER_NAME, VERSION } = await import('../../src/constants.js');
  
  const headers = {
    ...CORS_HEADERS,
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'healthy',
      service: SERVER_NAME,
      timestamp: new Date().toISOString(),
      version: VERSION,
      endpoints: {
        mcp: '/.netlify/functions/mcp',
        health: '/.netlify/functions/health'
      }
    })
  };
};