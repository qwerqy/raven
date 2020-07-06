import { DynamoDB, SNS } from "aws-sdk";
import * as uuid from "uuid";

const dynamoDb = new DynamoDB.DocumentClient();
const sns = new SNS();

export const create = async (event, context, callback) => {
  const timestamp = new Date().getTime();
  const { name, quantity, status = "created" } = JSON.parse(event.body);

  const orderId = uuid.v4();

  if (!name) {
    console.error("Validation failed, name is not found");
    callback(new Error("Name is not found"), null);
    return;
  }

  if (!quantity) {
    console.error("Validation failed, quantity is not found");
    callback(new Error("Quantity is not found"), null);
    return;
  }
  /**
   * data : {
   *  name: String;
   *  quantity: number;
   *  status: String;
   * }
   */
  const params = {
    TableName: process.env.DYNAMODB_TABLE || "raven-dev",
    Item: {
      id: orderId,
      name,
      quantity,
      status,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };

  // Insert item into dynamoDB
  try {
    const result = await dynamoDb.put(params).promise();
    const response = {
      statusCode: 200,
      body: JSON.stringify(result),
    };

    const payload = {
      Message: `order-${orderId}`,
      TopicArn: `arn:aws:sns:ap-southeast-1::processPayment`,
    };

    // Send payload to queue for processPayment PubSub
    await sns
      .publish(payload)
      .promise()
      .catch((err) => {
        throw err;
      });

    callback(null, response);
  } catch (err) {
    console.error(err);
    callback(new Error("Couldn't create order."));
    return;
  }
};

export const cancel = async (event: any, context, callback) => {
  const { id } = JSON.parse(event.body);

  if (!id) {
    console.error("Validation failed, id is not found");
    callback(new Error("id is not found"), null);
    return;
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE || "raven-dev",
    Key: {
      id: id,
    },
    UpdateExpression: "set status = :s",
    ExpressionAttributeValues: {
      ":s": "cancelled",
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
    callback(new Error("Couldn't cancel order."));
    return;
  }
};

export const status = async (event: any, context: any, callback: any) => {
  const { id } = JSON.parse(event.body);

  if (!id) {
    console.error("Validation failed, id is not found");
    callback(new Error("id is not found"), null);
    return;
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE || "raven-dev",
    Key: {
      id: id,
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();
    const response = {
      statusCode: 200,
      body: JSON.stringify(result),
    };
    callback(null, response);
  } catch (err) {
    console.error(err);
    callback(new Error("Couldn't get order."));
    return;
  }
};
