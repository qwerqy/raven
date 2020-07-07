import { bodyValidator, delay } from "./utils";
import { DynamoDB, SNS } from "aws-sdk";
import * as uuid from "uuid";

export const create = async (event) => {
  const dynamoDb = new DynamoDB.DocumentClient();
  const sns = new SNS();
  const timestamp = new Date().getTime();

  if (!bodyValidator(event.body)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Body is not found`,
      }),
    };
  }
  const { name, quantity, orderStatus = "created" } = JSON.parse(event.body);

  if (!name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `name is not found`,
      }),
    };
  }

  if (!quantity) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `quantity is not found`,
      }),
    };
  }

  const orderId = uuid.v4();

  /**
   * data : {
   *  name: String;
   *  quantity: number;
   *  orderStatus: String;
   * }
   */
  const params = {
    TableName: process.env.DYNAMODB_TABLE || "raven-dev",
    Item: {
      id: orderId,
      name,
      quantity,
      orderStatus,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };

  // Insert item into dynamoDB
  try {
    await dynamoDb.put(params).promise();

    const payload = {
      Message: `order=${orderId}`,
      TopicArn: `arn:aws:sns:ap-southeast-1:${process.env.AWS_ACCOUNT_ID}:processPayment`,
    };

    // Send payload to queue for processPayment PubSub
    await sns
      .publish(payload)
      .promise()
      .catch((err) => {
        throw err;
      });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully created order and payment process",
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Couldn't create order.",
      }),
    };
  }
};

export const cancel = async (event) => {
  const dynamoDb = new DynamoDB.DocumentClient();

  if (!bodyValidator(event.body)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Body is not found`,
      }),
    };
  }

  const { id } = JSON.parse(event.body);

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `id is not found`,
      }),
    };
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE || "raven-dev",
    Key: {
      id: id,
    },
    UpdateExpression: "set orderStatus = :s",
    ExpressionAttributeValues: {
      ":s": "cancelled",
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    const result = await dynamoDb.update(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Successfully cancelled order." }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Couldn't cancel order.",
      }),
    };
  }
};

export const status = async (event) => {
  const dynamoDb = new DynamoDB.DocumentClient();

  if (!bodyValidator(event.body)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Body is not found`,
      }),
    };
  }

  const { id } = JSON.parse(event.body);

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `id is not found`,
      }),
    };
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE || "raven-dev",
    Key: {
      id: id,
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Couldn't get order status.",
      }),
    };
  }
};

export const deliver = async (event: any) => {
  const dynamoDb = new DynamoDB.DocumentClient();
  const orderId = event.Records[0].dynamodb.Keys.id.S;
  const orderStatus = event.Records[0].dynamodb.NewImage.orderStatus.S;

  if (orderStatus === "confirmed") {
    const params = {
      TableName: process.env.DYNAMODB_TABLE || "raven-dev",
      Key: {
        id: orderId,
      },
      UpdateExpression: "set orderStatus = :s",
      ExpressionAttributeValues: {
        ":s": "delivered",
      },
      ReturnValues: "UPDATED_NEW",
    };

    try {
      delay(5000);
      await dynamoDb.update(params).promise();
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Successfully delivered order." }),
      };
    } catch (err) {
      console.error(err);
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Couldn't process order delivery.",
        }),
      };
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Payment for order declined. Skipping delivery.",
    }),
  };
};
