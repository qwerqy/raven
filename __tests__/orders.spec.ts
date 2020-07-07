import * as AWS from "aws-sdk-mock";
import * as eventFullBodyStub from "./stubs/eventFullBody.json";
import * as eventMissingQuantityBodyStub from "./stubs/eventMissingQuantityBody.json";
import * as eventNoBodyStub from "./stubs/eventNoBody.json";
import * as eventWithIdBodyStub from "./stubs/eventWithIdBody.json";
import * as eventDynamoDBConfirmedStream from "./stubs/eventDynamoDBConfirmedStream.json";
import * as eventDynamoDBDeclinedStream from "./stubs/eventDynamoDBDeclinedStream.json";

import * as order from "../src/order";
import { GetItemInput } from "aws-sdk/clients/dynamodb";

describe(`order.create`, () => {
  beforeAll(() => {
    AWS.mock(
      "DynamoDB.DocumentClient",
      "put",
      (params: GetItemInput, callback: Function) => {
        callback(null, {});
      }
    );
    AWS.mock("SNS", "publish", (params, callback) => {
      callback(null, "order=123123124");
    });
  });

  afterEach(() => {
    delete process.env.AWS_ACCOUNT_ID;
  });

  afterAll(() => {
    AWS.restore("DynamoDB.DocumentClient");
    AWS.restore("SNS");
  });

  it(`Create order with full body returns status 200`, async () => {
    process.env.AWS_ACCOUNT_ID = "123124123";

    const event = eventFullBodyStub;
    const context = {};

    const result = await order.create(event);
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully created order and payment process",
      }),
    });
  });

  it(`Returns error 400 if body is missing or empty`, async () => {
    process.env.AWS_ACCOUNT_ID = "123124123";

    const event = eventNoBodyStub;
    const context = {};

    const result = await order.create(event);
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        message: "Body is not found",
      }),
    });
  });

  it(`Returns error 400 if name or quantity is missing`, async () => {
    process.env.AWS_ACCOUNT_ID = "123124123";

    const event = eventMissingQuantityBodyStub;
    const context = {};

    const result = await order.create(event);
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        message: "quantity is not found",
      }),
    });
  });
});

describe(`order.cancel`, () => {
  beforeAll(() => {
    AWS.mock(
      "DynamoDB.DocumentClient",
      "update",
      (params: GetItemInput, callback: Function) => {
        callback(null, {});
      }
    );
  });

  afterAll(() => {
    AWS.restore("DynamoDB.DocumentClient");
  });

  it(`Cancel order when Id in body returns status 200`, async () => {
    const event = eventWithIdBodyStub;
    const context = {};

    const result = await order.cancel(event);
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully cancelled order.",
      }),
    });
  });

  it(`Returns error 400 if body is missing or empty`, async () => {
    const event = eventNoBodyStub;
    const context = {};

    const result = await order.cancel(event);
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        message: "Body is not found",
      }),
    });
  });
});

describe(`order.status`, () => {
  beforeAll(() => {
    AWS.mock(
      "DynamoDB.DocumentClient",
      "get",
      (params: GetItemInput, callback: Function) => {
        callback(null, {
          Item: {
            name: "box",
            quantity: 1,
            id: "123123123",
            orderStatus: "confirmed",
            createdAt: 111111,
            updatedAt: 111111,
          },
        });
      }
    );
  });

  afterAll(() => {
    AWS.restore("DynamoDB.DocumentClient");
  });

  it(`Get order when Id in body returns status 200`, async () => {
    const event = eventWithIdBodyStub;
    const context = {};

    const result = await order.status(event);
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        Item: {
          name: "box",
          quantity: 1,
          id: "123123123",
          orderStatus: "confirmed",
          createdAt: 111111,
          updatedAt: 111111,
        },
      }),
    });
  });

  it(`Returns error 400 if body is missing or empty`, async () => {
    const event = eventNoBodyStub;
    const context = {};

    const result = await order.status(event);
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        message: "Body is not found",
      }),
    });
  });
});

describe(`order.delivery`, () => {
  beforeAll(() => {
    AWS.mock(
      "DynamoDB.DocumentClient",
      "update",
      (params: GetItemInput, callback: Function) => {
        callback(null, {});
      }
    );
  });

  afterAll(() => {
    AWS.restore("DynamoDB.DocumentClient");
  });

  it(`Deliver order when order status is confirmed`, async () => {
    const event = eventDynamoDBConfirmedStream;
    const context = {};

    const result = await order.deliver(event);
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully delivered order.",
      }),
    });
  });

  it(`Returns 200 if order status is declined`, async () => {
    const event = eventDynamoDBDeclinedStream;
    const context = {};

    const result = await order.deliver(event);
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: "Payment for order declined. Skipping delivery.",
      }),
    });
  });
});
