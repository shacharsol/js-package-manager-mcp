// Health check endpoint for Netlify
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'healthy',
        service: 'npm-plus-mcp-server',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
          mcp: '/.netlify/functions/npmplus-mcp',
          health: '/.netlify/functions/npmplus-health',
          analytics: '/.netlify/functions/npmplus-analytics'
        }
      })
    };
  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        service: 'npm-plus-mcp-server',
        timestamp: new Date().toISOString(),
        error: error.message
      })
    };
  }
};