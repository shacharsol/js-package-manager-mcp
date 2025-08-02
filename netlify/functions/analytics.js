// Simple analytics function that doesn't depend on TypeScript build
export const handler = async (event, context) => {
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
    
    // Analytics data API - Simple mock data for now
    if (event.httpMethod === 'GET' && isDataRequest) {
      const mockData = {
        period: "7 days",
        totalCalls: 1247,
        avgDailyCalls: 178,
        successRate: 98,
        avgResponseTime: 245,
        topTools: {
          "search_packages": 486,
          "install_packages": 298,
          "package_info": 156,
          "update_packages": 134,
          "check_outdated": 89,
          "audit_dependencies": 84
        },
        editors: {
          "claude": 648,
          "windsurf": 351,
          "cursor": 178,
          "vscode": 70
        },
        dailyStats: {
          "2024-01-15": { date: "2024-01-15", totalCalls: 189, successRate: 0.98 },
          "2024-01-16": { date: "2024-01-16", totalCalls: 156, successRate: 0.97 },
          "2024-01-17": { date: "2024-01-17", totalCalls: 203, successRate: 0.99 },
          "2024-01-18": { date: "2024-01-18", totalCalls: 178, successRate: 0.98 },
          "2024-01-19": { date: "2024-01-19", totalCalls: 167, successRate: 0.96 },
          "2024-01-20": { date: "2024-01-20", totalCalls: 198, successRate: 0.99 },
          "2024-01-21": { date: "2024-01-21", totalCalls: 156, successRate: 0.97 }
        }
      };
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockData)
      };
    }
    
    // Analytics dashboard HTML (default)
    if (event.httpMethod === 'GET') {
      const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NPM Plus Analytics Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8fafc;
        }
        .dashboard {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #2563eb;
        }
        .stat-label {
            color: #64748b;
            margin-top: 5px;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .bar {
            height: 20px;
            background: #2563eb;
            margin: 5px 0;
            border-radius: 4px;
            position: relative;
        }
        .bar-label {
            position: absolute;
            left: 10px;
            color: white;
            font-size: 12px;
            line-height: 20px;
        }
        .refresh-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin-left: 10px;
        }
        .refresh-btn:hover {
            background: #1d4ed8;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>📊 NPM Plus Analytics Dashboard</h1>
            <p>Real-time usage analytics for your MCP server</p>
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
        </div>
        
        <div id="analytics-content">
            Loading analytics...
        </div>
    </div>

    <script>
        async function loadAnalytics() {
            try {
                const response = await fetch('/api/analytics-data');
                const data = await response.json();
                renderAnalytics(data);
            } catch (error) {
                document.getElementById('analytics-content').innerHTML = 
                    '<p style="color: red;">Failed to load analytics data: ' + error.message + '</p>';
            }
        }
        
        function renderAnalytics(data) {
            const content = \`
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">\${data.totalCalls.toLocaleString()}</div>
                        <div class="stat-label">Total API Calls (7 days)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">\${data.avgDailyCalls.toLocaleString()}</div>
                        <div class="stat-label">Average Daily Calls</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">\${data.successRate}%</div>
                        <div class="stat-label">Success Rate</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">\${data.avgResponseTime}ms</div>
                        <div class="stat-label">Avg Response Time</div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h3>🔧 Most Popular Tools</h3>
                    \${renderToolChart(data.topTools)}
                </div>
                
                <div class="chart-container">
                    <h3>💻 Editor Breakdown</h3>
                    \${renderEditorChart(data.editors)}
                </div>
                
                <div class="chart-container">
                    <h3>📈 Daily Usage Trend</h3>
                    \${renderDailyChart(data.dailyStats)}
                </div>
            \`;
            
            document.getElementById('analytics-content').innerHTML = content;
        }
        
        function renderToolChart(tools) {
            const maxCount = Math.max(...Object.values(tools));
            return Object.entries(tools)
                .slice(0, 10)
                .map(([tool, count]) => \`
                    <div style="margin: 10px 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                            <span>\${tool}</span>
                            <span>\${count}</span>
                        </div>
                        <div class="bar" style="width: \${(count / maxCount) * 100}%">
                            <div class="bar-label">\${((count / maxCount) * 100).toFixed(1)}%</div>
                        </div>
                    </div>
                \`).join('');
        }
        
        function renderEditorChart(editors) {
            const maxCount = Math.max(...Object.values(editors));
            return Object.entries(editors)
                .map(([editor, count]) => \`
                    <div style="margin: 10px 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                            <span>\${editor.charAt(0).toUpperCase() + editor.slice(1)}</span>
                            <span>\${count}</span>
                        </div>
                        <div class="bar" style="width: \${(count / maxCount) * 100}%">
                            <div class="bar-label">\${((count / maxCount) * 100).toFixed(1)}%</div>
                        </div>
                    </div>
                \`).join('');
        }
        
        function renderDailyChart(dailyStats) {
            const dates = Object.keys(dailyStats).sort();
            const maxCalls = Math.max(...dates.map(date => dailyStats[date].totalCalls));
            
            return dates.map(date => \`
                <div style="margin: 10px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                        <span>\${new Date(date).toLocaleDateString()}</span>
                        <span>\${dailyStats[date].totalCalls} calls</span>
                    </div>
                    <div class="bar" style="width: \${(dailyStats[date].totalCalls / maxCalls) * 100}%">
                        <div class="bar-label">\${(dailyStats[date].successRate * 100).toFixed(1)}% success</div>
                    </div>
                </div>
            \`).join('');
        }
        
        // Load analytics on page load
        loadAnalytics();
        
        // Auto-refresh every 5 minutes
        setInterval(loadAnalytics, 5 * 60 * 1000);
    </script>
</body>
</html>
      `;
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'text/html'
        },
        body: dashboardHTML
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
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};