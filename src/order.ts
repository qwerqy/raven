import { bodyValidator } from "./utils";
import { DynamoDB, SNS } from "aws-sdk";
import * as uuid from "uuid";

const dynamoDb = new DynamoDB.DocumentClient();
const sns = new SNS();

export const create = async (event, context, callback) => {
  const timestamp = new Date().getTime();
  const { name, quantity, orderStatus = "created" } = JSON.parse(event.body);

  const orderId = uuid.v4();

  bodyValidator({ name, quantity }).map((key) => {
    if (key) {
      console.error(`Validation failed, ${key} is not found`);
      callback(new Error(`${key} is not found`), null);
      return;
    }
  });

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
    const response = {
      statusCode: 200,
    };

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

    callback(null, response);
  } catch (err) {
    console.error(err);
    callback(new Error("Couldn't create order."));
    return;
  }
};

export const cancel = async (event: any, context, callback) => {
  const { id } = JSON.parse(event.body);

  bodyValidator({ id }).map((key) => {
    if (key) {
      console.error(`Validation failed, ${key} is not found`);
      callback(new Error(`${key} is not found`), null);
      return;
    }
  });

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

  bodyValidator({ id }).map((key) => {
    if (key) {
      console.error(`Validation failed, ${key} is not found`);
      callback(new Error(`${key} is not found`), null);
      return;
    }
  });

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
