# Contributing

This document describes how to deploy to a development environment and submit your contributions.

## Prerequisites

- Some basic knowledge of AWS and [CloudFormation](https://aws.amazon.com/cloudformation/)
- Requires [SAM](https://aws.amazon.com/serverless/sam/) and [aws-cli](https://aws.amazon.com/cli/)
- Building dependencies with the correct architecture requires [Docker](https://docs.docker.com/get-docker/).

## Deploy

### Using SAM

The easiest way to deploy is using the SAM guided command:

```sh
sam build --use-container
sam deploy --guided
```

If successful, make note of the `Endpoint - IIIF Endpoint URL` output. You'll need this to test the API.

### Using CloudFormation

Alternatively, you can use the aws-cli using the cloudformation command. You'll need to replace a few inputs below in order to give CloudFormation the information it needs to deploy the API:

- `stagingbucket` - tells it where to put your packaged Lambda code so that CloudFormation can deploy it.
- `stackname` - tells it what CloudFormation Stack to deploy to.
- `region` - what AWS region to deploy to.
- `imagesourcebucket` - this will tell the deployed Lambda where to find your source images when serving requests.

```sh
aws cloudformation package \
  --template-file ./template.yml \
  --s3-bucket $stagingbucket \
  --output-template-file package_output.yml
aws cloudformation deploy \
  --capabilities CAPABILITY_IAM \
  --region $region \
  --stack-name $stackname \
  --template-file package_output.yml \
  --parameter-overrides SourceBucket=$imagesourcebucket
```

Repeat these steps for any code changes to the lambda

## Test the API

To test the API, you'll need an identifier that exists in your source bucket. Make a request for that identifier with:

`https://<myapiendpoint>/<myimageidentifier>/full/full/0/default.jpg`

If you used SAM to deploy, replace `<myapiendpoint>` with the value from `Endpoint - IIIF Endpoint URL`.

If you did not use SAM, or otherwise need to find the API endpoint, a quick way to get it is by querying the Endpoint output from the stack. You can get this via the AWS CloudFormation console for your stack, or via the cli with:

```sh
aws cloudformation describe-stacks \
  --region $region \
  --stack-name=$stackname \
  --query 'Stacks[0].Outputs[? OutputKey==`Endpoint`].OutputValue' \
  --output text
```

## Pull Request

Once you've completed your changes and confirmed that they are working:

1. Push to a GitHub fork.
1. Submit a Pull Request on GitHub. Your changes will be reviewed by one of the maintainers.
