import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient();

export const processPayment = async (
  event: any,
  context: any,
  callback: any
) => {
  const order: string = event.Records[0].Sns.Message;
  // order returns "order-{ORDER ID}}"

  const orderId = order.split("-")[1];
  const paymentStatusArray = ["confirmed", "declined"];

  const paymentStatus =
    paymentStatusArray[Math.floor(Math.random() * paymentStatusArray.length)];

  const params = {
    TableName: process.env.DYNAMODB_TABLE || "raven-dev",
    Key: {
      id: orderId,
    },
    UpdateExpression: "set status = :s",
    ExpressionAttributeValues: {
      ":s": paymentStatus,
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    const result = await dynamoDb.update(params).promise();
    const response = {
      statusCode: 200,
      body: JSON.stringify(result),
    };
    callback(null, response);
  } catch (err) {
    console.error(err);
    callback(new Error("Couldn't process order payment."));
    return;
  }
};
