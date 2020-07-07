import { DynamoDB, SNS } from "aws-sdk";

export const processPayment = async (event: any) => {
  const dynamoDb = new DynamoDB.DocumentClient();
  const sns = new SNS();
  const order: string = event.Records[0].Sns.Message;
  // order returns "order={ORDER ID}}"

  const orderId = order.split("=")[1];
  const paymentStatusArray = ["confirmed", "declined"];

  const paymentStatus =
    paymentStatusArray[Math.floor(Math.random() * paymentStatusArray.length)];

  const payload = {
    Message: `order=${paymentStatus}=${orderId}`,
    TopicArn: `arn:aws:sns:ap-southeast-1:${process.env.AWS_ACCOUNT_ID}:processDelivery`,
  };

  const params = {
    TableName: process.env.DYNAMODB_TABLE || "raven-dev",
    Key: {
      id: orderId,
    },
    UpdateExpression: "set orderStatus = :s",
    ExpressionAttributeValues: {
      ":s": paymentStatus,
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    const result = await dynamoDb.update(params).promise();

    // Send payload to queue for processPayment PubSub
    await sns
      .publish(payload)
      .promise()
      .catch((err) => {
        throw err;
      });

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Couldn't process order payment.",
      }),
    };
  }
};
