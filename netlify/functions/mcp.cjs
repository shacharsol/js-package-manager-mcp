// Netlify function wrapper for MCP server
// This file adapts the TypeScript MCP server for Netlify Functions

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    // Dynamic import to avoid build issues with ES modules
    const { handler } = await import('../../dist/netlify-adapter.js');
    
    // Use the handler directly
    const result = await handler(event, context);
    
    return {
      statusCode: result.statusCode || 200,
      headers: { ...headers, ...result.headers },
      body: result.body
    };
  } catch (error) {
    console.error('MCP handler error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};