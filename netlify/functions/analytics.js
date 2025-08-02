const { analytics } = require('../../dist/analytics.js');
const { createAnalyticsDashboard, handleAnalyticsAPI } = require('../../dist/analytics-dashboard.js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const path = event.path || event.rawUrl;
    
    // Analytics dashboard HTML
    if (event.httpMethod === 'GET' && !path.includes('/data')) {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'text/html'
        },
        body: createAnalyticsDashboard()
      };
    }
    
    // Analytics data API
    if (event.httpMethod === 'GET' && path.includes('/data')) {
      const summary = await analytics.getSummary(7);
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(summary)
      };
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };
    
  } catch (error) {
    console.error('Analytics error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};