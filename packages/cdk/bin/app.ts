#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FrontendStack } from '../lib/frontend-stack/index';
import { BackendStack } from '../lib/backend-stack/index';
import { PipelineStack } from '../lib/pipeline-stack/index';

const app = new cdk.App();

// Define environment
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '123456789012', // Default account ID
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
};

// Create only the backend stack for now
// new FrontendStack(app, 'HiiveSentimentFrontendStack', { env });
new BackendStack(app, 'HiiveSentimentBackendStack', { env });
// new PipelineStack(app, 'HiiveSentimentPipelineStack', { env });

// Add tags to all resources
cdk.Tags.of(app).add('Project', 'HiiveSentimentAnalyzer');
cdk.Tags.of(app).add('Environment', 'Demo');
cdk.Tags.of(app).add('ManagedBy', 'CDK');

app.synth();