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
        // Return basic analytics data for now
        const analyticsData = {
          totalCalls: 0,
          totalPackages: 0,
          popularPackages: [],
          recentActivity: [],
          timestamp: new Date().toISOString()
        };
        
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
        const dashboardHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NPM Plus Analytics</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .metric h3 { margin: 0 0 10px 0; color: #666; }
        .metric .value { font-size: 2em; font-weight: bold; color: #007acc; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 NPM Plus Analytics Dashboard</h1>
        <div class="metric">
            <h3>Total API Calls</h3>
            <div class="value">0</div>
        </div>
        <div class="metric">
            <h3>Packages Analyzed</h3>
            <div class="value">0</div>
        </div>
        <div class="metric">
            <h3>Status</h3>
            <div class="value">🟢 Online</div>
        </div>
        <p><small>Analytics system initializing...</small></p>
    </div>
</body>
</html>`;
        
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