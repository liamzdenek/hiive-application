import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as path from 'path';

export class BackendStack extends cdk.Stack {
  // Expose the API URL as a public property
  public readonly apiUrl: string;
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket for article storage
    const articlesBucket = new s3.Bucket(this, 'ArticlesBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
      lifecycleRules: [
        {
          // Add lifecycle rule to expire sentiment analysis files after 30 days
          id: 'ExpireSentimentFiles',
          enabled: true,
          prefix: 'analysis/',
          expiration: cdk.Duration.days(30),
        },
        {
          // Keep the latest summary files, but expire older versions
          id: 'ExpireOldSummaries',
          enabled: true,
          prefix: 'summaries/',
          noncurrentVersionExpiration: cdk.Duration.days(1),
        }
      ],
    });

    // Create a Lambda function for the API
    const apiLambda = new nodejs.NodejsFunction(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/src/lambda.ts'),
      handler: 'handler', // Using the new promise-based handler
      environment: {
        ARTICLES_BUCKET: articlesBucket.bucketName,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || 'demo-key',
        NODE_ENV: 'production',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: {
        minify: true,
        sourceMap: true,
        // Don't exclude aws-sdk as it's needed by the Lambda function
        externalModules: [],
        nodeModules: ['express', 'serverless-http', 'aws-sdk', 'axios'],
      },
    });

    // Create a Lambda function for article processing
    const articleProcessorLambda = new nodejs.NodejsFunction(this, 'ArticleProcessorLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/src/handlers/articleProcessor.ts'),
      handler: 'handler',
      environment: {
        ARTICLES_BUCKET: articlesBucket.bucketName,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || 'demo-key',
        NODE_ENV: 'production',
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      bundling: {
        minify: true,
        sourceMap: true,
        // Don't exclude aws-sdk as it's needed by the Lambda function
        externalModules: [],
        nodeModules: ['aws-sdk', 'axios'],
      },
    });

    // Create a Lambda function for summary aggregation
    const summaryAggregatorLambda = new nodejs.NodejsFunction(this, 'SummaryAggregatorLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../backend/src/handlers/summaryAggregator.ts'),
      handler: 'handler',
      environment: {
        ARTICLES_BUCKET: articlesBucket.bucketName,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || 'demo-key',
        NODE_ENV: 'production',
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      bundling: {
        minify: true,
        sourceMap: true,
        // Don't exclude aws-sdk as it's needed by the Lambda function
        externalModules: [],
        nodeModules: ['aws-sdk', 'axios'],
      },
    });

    // Grant permissions to the Lambda functions
    articlesBucket.grantReadWrite(apiLambda);
    articlesBucket.grantReadWrite(articleProcessorLambda);
    articlesBucket.grantReadWrite(summaryAggregatorLambda);

    // Set up S3 event notification for article processing
    articlesBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(articleProcessorLambda),
      { prefix: 'articles/' }
    );

    // Set up scheduled event for summary aggregation
    const rule = new events.Rule(this, 'ScheduledSummaryAggregation', {
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
    });
    rule.addTarget(new targets.LambdaFunction(summaryAggregatorLambda));

    // Create an API Gateway
    const api = new apigateway.RestApi(this, 'SentimentApi', {
      restApiName: 'Hiive Sentiment API',
      description: 'API for Hiive Sentiment Analyzer',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create a Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(apiLambda);

    // Add routes
    const apiResource = api.root.addResource('api');
    
    // Health check endpoint
    const health = apiResource.addResource('health');
    health.addMethod('GET', lambdaIntegration);
    
    // Companies endpoints
    const companies = apiResource.addResource('companies');
    const company = companies.addResource('{companyId}');
    const sentiment = company.addResource('sentiment');
    sentiment.addMethod('GET', lambdaIntegration);
    
    // Sentiment history endpoint
    const history = sentiment.addResource('history');
    history.addMethod('GET', lambdaIntegration);
    
    // Sentiment refresh endpoint
    const refresh = sentiment.addResource('refresh');
    refresh.addMethod('POST', lambdaIntegration);
    
    // Articles endpoints
    const articles = apiResource.addResource('articles');
    articles.addMethod('POST', lambdaIntegration);
    
    // Company articles endpoint
    const companyArticles = company.addResource('articles');
    companyArticles.addMethod('GET', lambdaIntegration);

    // Set the API URL property
    this.apiUrl = api.url;
    
    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.apiUrl,
      description: 'The URL of the API Gateway',
    });

    // Output the S3 bucket name
    new cdk.CfnOutput(this, 'ArticlesBucketName', {
      value: articlesBucket.bucketName,
      description: 'The name of the S3 bucket for articles',
    });
  }
}