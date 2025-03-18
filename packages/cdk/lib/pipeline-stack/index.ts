import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an artifact bucket for the pipeline
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Create the pipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'HiiveSentimentPipeline',
      artifactBucket,
    });

    // Source stage
    const sourceOutput = new codepipeline.Artifact('SourceCode');
    const sourceAction = new codepipeline_actions.CodeStarConnectionsSourceAction({
      actionName: 'GitHub',
      owner: 'hiive',
      repo: 'sentiment-analyzer',
      branch: 'main',
      output: sourceOutput,
      connectionArn: cdk.Fn.importValue('GitHubConnectionArn'),
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Build stage
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '20',
            },
            commands: [
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm run build',
              'npm run test',
            ],
          },
        },
        artifacts: {
          'base-directory': '.',
          files: [
            'packages/frontend/dist/**/*',
            'packages/backend/dist/**/*',
            'packages/cdk/cdk.out/**/*',
            'packages/desktop/dist/**/*',
          ],
        },
      }),
    });

    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    // Deploy stage
    const deployProject = new codebuild.PipelineProject(this, 'DeployProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '20',
            },
            commands: [
              'npm install -g aws-cdk',
            ],
          },
          build: {
            commands: [
              'cd packages/cdk',
              'npm ci',
              'cdk deploy --all --require-approval never',
            ],
          },
        },
      }),
    });

    // Grant the deploy project the ability to deploy CloudFormation stacks
    deployProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cloudformation:*',
          's3:*',
          'iam:*',
          'lambda:*',
          'apigateway:*',
          'cloudfront:*',
          'ssm:*',
          'events:*',
        ],
        resources: ['*'],
      })
    );

    const deployAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Deploy',
      project: deployProject,
      input: buildOutput,
    });

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction],
    });

    // Output the pipeline name
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'The name of the pipeline',
    });
  }
}