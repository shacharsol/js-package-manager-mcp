// Debug endpoint for MCP HTTP transport troubleshooting
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // Return detailed request information for debugging
  const debugInfo = {
    timestamp: new Date().toISOString(),
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    query: event.queryStringParameters,
    body: event.body,
    userAgent: event.headers['user-agent'] || event.headers['User-Agent'],
    clientIP: event.headers['x-forwarded-for'] || event.headers['x-real-ip'],
    isBase64Encoded: event.isBase64Encoded
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(debugInfo, null, 2)
  };
};