import { Handler } from '@netlify/functions';
import { SERVICE_VERSION } from './constants';

/**
 * Netlify Function handler for the health endpoint.
 * Responds with service health status, version, and available endpoints.
 *
 * @param event - The incoming HTTP event.
 * @param context - The Netlify function context.
 * @returns An HTTP response with health information.
 */
export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
      service: 'npm-plus-mcp-server',
      timestamp: new Date().toISOString(),
      version: SERVICE_VERSION,
      endpoints: {
        mcp: '/.netlify/functions/mcp',
        health: '/.netlify/functions/health'
      }
    })
  };
};