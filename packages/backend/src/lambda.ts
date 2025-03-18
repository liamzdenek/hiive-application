import app from './index';

/**
 * Lambda handler for API Gateway events
 * This handler translates API Gateway events to Express requests
 */
export const apiHandler = async (event: any, context: any): Promise<any> => {
  // Log the incoming request
  console.log('API request:', {
    path: event.path,
    method: event.httpMethod,
    queryParams: event.queryStringParameters,
    sourceIp: event.requestContext?.identity?.sourceIp,
    userAgent: event.requestContext?.identity?.userAgent,
  });

  try {
    // Create a simple Express-compatible request object
    const req: any = {
      method: event.httpMethod,
      url: event.path,
      path: event.path,
      headers: event.headers || {},
      query: event.queryStringParameters || {},
      params: event.pathParameters || {},
      body: event.body ? JSON.parse(event.body) : {},
    };

    // Create a simple Express-compatible response object
    const res: any = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: '',
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.body = JSON.stringify(data);
        return this;
      },
      send(data: any) {
        this.body = typeof data === 'string' ? data : JSON.stringify(data);
        return this;
      },
      end() {
        return this;
      },
      header(key: string, value: string) {
        this.headers[key] = value;
        return this;
      },
      setHeader(key: string, value: string) {
        this.headers[key] = value;
        return this;
      },
    };

    // Add /api prefix to the path if it doesn't exist
    if (!req.path.startsWith('/api')) {
      req.path = `/api${req.path}`;
      req.url = `/api${req.url}`;
    }

    console.log(`Routing request to Express app: ${req.method} ${req.path}`);

    // Find the matching route in the Express app
    const routes = app._router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    console.log('Available routes:', routes);

    // Find the matching route handler
    const matchingRoute = app._router.stack.find((layer: any) => {
      if (!layer.route) return false;
      
      // Check if the path matches
      const routePath = layer.route.path;
      const pathMatches = routePath === req.path;
      
      // Check if the method matches
      const methodMatches = layer.route.methods[req.method.toLowerCase()];
      
      return pathMatches && methodMatches;
    });

    if (!matchingRoute) {
      console.log(`No matching route found for ${req.method} ${req.path}`);
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({
          status: 'error',
          code: 'NOT_FOUND',
          message: `Route not found: ${req.method} ${req.path}`,
        }),
      };
    }

    console.log(`Found matching route: ${matchingRoute.route.path}`);

    // Execute the route handler
    await new Promise<void>((resolve, reject) => {
      const next = (err?: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      };

      // Capture the original json/send methods
      const originalJson = res.json;
      const originalSend = res.send;
      const originalEnd = res.end;

      // Override json method to resolve the promise when response is sent
      res.json = function(data: any) {
        originalJson.call(this, data);
        resolve();
        return this;
      };

      // Override send method to resolve the promise when response is sent
      res.send = function(data: any) {
        originalSend.call(this, data);
        resolve();
        return this;
      };

      // Override end method to resolve the promise when response is ended
      res.end = function() {
        originalEnd.call(this);
        resolve();
        return this;
      };

      try {
        matchingRoute.handle(req, res, next);
      } catch (error) {
        reject(error);
      }
    });

    // Return the response
    return {
      statusCode: res.statusCode,
      headers: res.headers,
      body: res.body,
    };
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