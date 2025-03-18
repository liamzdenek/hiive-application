import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
// Import when needed
// import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class BackendStack extends cdk.Stack {
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
    });

    // Create a Lambda function for the API
    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      environment: {
        ARTICLES_BUCKET: articlesBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // Create a Lambda function for article processing
    const articleProcessorLambda = new lambda.Function(this, 'ArticleProcessorLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'articleProcessor.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      environment: {
        ARTICLES_BUCKET: articlesBucket.bucketName,
        OPENAI_API_KEY: ssm.StringParameter.valueForStringParameter(
          this,
          '/hiive-sentiment/openai-api-key'
        ),
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
    });

    // Create a Lambda function for summary aggregation
    const summaryAggregatorLambda = new lambda.Function(this, 'SummaryAggregatorLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'summaryAggregator.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      environment: {
        ARTICLES_BUCKET: articlesBucket.bucketName,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
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
    const companies = api.root.addResource('companies');
    const company = companies.addResource('{companyId}');
    const sentiment = company.addResource('sentiment');
    sentiment.addMethod('GET', lambdaIntegration);

    const articles = api.root.addResource('articles');
    articles.addMethod('POST', lambdaIntegration);

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'The URL of the API Gateway',
    });

    // Output the S3 bucket name
    new cdk.CfnOutput(this, 'ArticlesBucketName', {
      value: articlesBucket.bucketName,
      description: 'The name of the S3 bucket for articles',
    });
  }
}