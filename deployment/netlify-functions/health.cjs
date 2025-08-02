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

  try {
    // Dynamic import to avoid build issues
    const { createHealthCheck } = await import('../../dist/health.js');
    
    const healthData = await createHealthCheck();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(healthData)
    };
  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      })
    };
  }
};