// Analytics endpoint for Netlify
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
    const path = event.path || event.rawUrl || '';
    const isDataRequest = path.includes('/data') || event.queryStringParameters?.data === 'true';
    
    // Analytics data API - Basic data for open source version
    if (event.httpMethod === 'GET' && isDataRequest) {
      try {
        // Dynamic import to avoid build issues with ES modules
        const { createAnalyticsData } = await import('../../dist/analytics.js');
        
        const analyticsData = await createAnalyticsData();
        
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(analyticsData)
        };
      } catch (error) {
        console.error('Analytics data error:', error);
        
        // Return minimal data on error
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalCalls: 0,
            totalPackages: 0,
            popularPackages: [],
            recentActivity: [],
            error: 'Analytics temporarily unavailable'
          })
        };
      }
    }
    
    // Analytics dashboard - Return HTML
    if (event.httpMethod === 'GET') {
      try {
        const { createAnalyticsDashboard } = await import('../../dist/analytics-dashboard.js');
        
        const dashboardHtml = await createAnalyticsDashboard();
        
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'text/html' },
          body: dashboardHtml
        };
      } catch (error) {
        console.error('Analytics dashboard error:', error);
        
        return {
          statusCode: 500,
          headers: { ...headers, 'Content-Type': 'text/html' },
          body: `
            <html>
              <head><title>Analytics Error</title></head>
              <body>
                <h1>Analytics Dashboard Temporarily Unavailable</h1>
                <p>Error: ${error.message}</p>
              </body>
            </html>
          `
        };
      }
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Analytics handler error:', error);
    
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