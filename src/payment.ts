import { DynamoDB } from "aws-sdk";

export const processPayment = async (event: any) => {
  const dynamoDb = new DynamoDB.DocumentClient();
  const order: string = event.Records[0].Sns.Message;
  // order returns "order={ORDER ID}}"

  const orderId = order.split("=")[1];
  const paymentStatusArray = ["confirmed", "declined"];

  const paymentStatus =
    paymentStatusArray[Math.floor(Math.random() * paymentStatusArray.length)];

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
