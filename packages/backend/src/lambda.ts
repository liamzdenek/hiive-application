import serverless from 'serverless-http';
import app from './index';

/**
 * Lambda handler for API Gateway events
 * Using serverless-http to handle the API Gateway events
 * 
 * This simplifies the integration between Express and AWS Lambda
 * by handling all the request/response mapping automatically
 */
export const apiHandler = serverless(app, {
  // Configuration options
  requestId: 'awsRequestId',
  
  // Add a custom logger to log requests
  request: (request: any, event: any, context: any) => {
    console.log('API request:', {
      path: event.path,
      method: event.httpMethod,
      queryParams: event.queryStringParameters,
      sourceIp: event.requestContext?.identity?.sourceIp,
      userAgent: event.requestContext?.identity?.userAgent,
    });
    
    // Log detailed path information for debugging
    console.log('Path debug info:', {
      eventPath: event.path,
      requestPath: request.path,
      eventPathType: typeof event.path,
      requestPathType: typeof request.path,
      requestUrlOriginal: request.url
    });
    
    // Add /api prefix to the path if it doesn't exist
    if (request.path && !request.path.startsWith('/api')) {
      request.path = `/api${request.path}`;
      request.url = `/api${request.url}`;
    } else if (!request.path) {
      // Handle case where path is undefined
      console.warn('Request path is undefined, attempting to set from event.path');
      if (event.path) {
        const path = event.path.startsWith('/api') ? event.path : `/api${event.path}`;
        request.path = path;
        request.url = request.url ? path : path;
      } else {
        console.error('Both request.path and event.path are undefined');
      }
    }
    
    console.log(`Request path after prefix: ${request.path}`);
  },
  
  // Add a custom logger to log responses
  response: (response: any) => {
    console.log(`Response status code: ${response.statusCode}`);
  }
});

// Export a promise-based handler for more flexibility
export const handler = async (event: any, context: any) => {
  try {
    // You can do additional processing here before handling the request
    const result = await apiHandler(event, context);
    // You can do additional processing here after handling the request
    return result;
  } catch (error) {
    console.error('Error handling API request:', error);
    
    // Extract error details
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error instanceof Error && 'code' in error ? (error as any).code : 'INTERNAL_ERROR';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log detailed error information
    console.error('Detailed error information:', {
      message: errorMessage,
      code: errorCode,
      stack: errorStack,
    });
    
    // Return a 500 error response with more details
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: JSON.stringify({
        status: 'error',
        code: errorCode,
        message: errorMessage,
        requestId: context.awsRequestId,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};