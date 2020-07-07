# Raven

## Order & Payment Management System

This project showcases the ability to how it is possible to create an Order Management System by taking advantage of the AWS Cloud Platform using the Serverless framework.

When an order is created, it will be created in the DB, and then publish a message to a subscriber that will run the `processPayment` function via AWS SNS.

Order payment status will then be published through AWS SNS to `processDelivery` function for delivery.

### Stack

- Typescript NodeJS
- Serverless Framework
  - AWS Lambda
  - AWS API Gateway
  - AWS DynamoDB
  - AWS SNS

### Setup

Make sure you have serverless installed globally

`$ npm i serverless -g`

Then create an account on serverless or sign in to an existing account

`$ serverless login`

Register AWS profile via serverless.

Install dependencies

`$ npm i`

### Development

To transpile Typescript

`$ npm run build`

### Environment Variables

```
AWS_ACCOUNT_ID
```

### Testing

Run unit & integration tests

`$ npm run test`

Tests are run before `sls deploy` when invoke by `npm run deploy` script
