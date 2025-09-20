import * as path from "path";

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as logs from "aws-cdk-lib/aws-logs";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as firehose from "aws-cdk-lib/aws-kinesisfirehose";

export interface LogPipelineStackProps extends cdk.StackProps {
  project: string;
  stage: string;
  dataLakeBucket: s3.IBucket;
}

export class LogPipelineStack extends cdk.Stack {
  readonly deliveryStreamArn: string;

  constructor(scope: Construct, id: string, props: LogPipelineStackProps) {
    super(scope, id, props);

    const { project, stage, dataLakeBucket } = props;
    const projectStage = `${project}-${stage}`;

    const transformFnName = `${projectStage}-transform-log`;
    const transformFnLogGroup = new logs.LogGroup(
      this,
      "transform-fn-log-group",
      {
        logGroupName: `/aws/lambda/${transformFnName}`,
        retention: logs.RetentionDays.ONE_WEEK,
        // only dev
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
    );

    const transformFn = new lambdaNodejs.NodejsFunction(this, "transform-fn", {
      functionName: transformFnName,
      entry: path.join(__dirname, "./lambda/transform-log.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      loggingFormat: lambda.LoggingFormat.JSON,
      timeout: cdk.Duration.minutes(3),
      logGroup: transformFnLogGroup,
    });

    const transformFnVersion = transformFn.currentVersion;

    const transformFnAlias = new lambda.Alias(this, "transform-fn-alias", {
      aliasName: "live",
      version: transformFnVersion,
    });

    const streamRole = new iam.Role(this, "stream-role", {
      roleName: `${projectStage}-stream-role`,
      assumedBy: new iam.ServicePrincipal("firehose.amazonaws.com"),
    });

    const streamLogGroup = new logs.LogGroup(this, "stream-log-group", {
      logGroupName: `/aws/firehose-stream/${projectStage}`,
      retention: logs.RetentionDays.ONE_WEEK,
      // only dev
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const streamLogStream = streamLogGroup.addStream("stream-log-stream", {
      logStreamName: "event-log-stream",
    });

    const deliveryStream = new firehose.CfnDeliveryStream(this, "stream", {
      deliveryStreamName: `${projectStage}-event-log-stream`,
      extendedS3DestinationConfiguration: {
        bucketArn: dataLakeBucket.bucketArn,
        roleArn: streamRole.roleArn,
        prefix:
          "bronze/raw/events/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/",
        errorOutputPrefix:
          "errors/raw/events/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/",
        bufferingHints: {
          intervalInSeconds: cdk.Duration.seconds(60).toSeconds(),
          sizeInMBs: cdk.Size.mebibytes(1).toMebibytes(),
        },
        compressionFormat: firehose.Compression.UNCOMPRESSED.value,
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: streamLogGroup.logGroupName,
          logStreamName: streamLogStream.logStreamName,
        },
        processingConfiguration: {
          enabled: true,
          processors: [
            {
              type: "Decompression",
              parameters: [
                {
                  parameterName: "CompressionFormat",
                  parameterValue: "GZIP",
                },
              ],
            },
            {
              type: "CloudWatchLogProcessing",
              parameters: [
                {
                  parameterName: "DataMessageExtraction",
                  parameterValue: "true",
                },
              ],
            },
            {
              type: "Lambda",
              parameters: [
                {
                  parameterName: "LambdaArn",
                  parameterValue: transformFnAlias.functionArn,
                },
              ],
            },
          ],
        },
      },
    });

    transformFnLogGroup.grantWrite(streamRole);

    transformFn.grantInvoke(streamRole);

    dataLakeBucket.grantWrite(streamRole);

    streamLogGroup.grantWrite(streamRole);

    this.deliveryStreamArn = deliveryStream.attrArn;
  }
}
