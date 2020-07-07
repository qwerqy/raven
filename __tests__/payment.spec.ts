import * as AWS from "aws-sdk-mock";
import * as eventFullBodyStub from "./stubs/eventFullBody.json";
import * as eventSNSStub from "./stubs/eventSNS.json";
import * as payment from "../src/payment";
import { GetItemInput } from "aws-sdk/clients/dynamodb";

describe(`order.create`, () => {
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

  it(`Returns status 200 if update is successful`, async () => {
    const event = eventSNSStub;
    const context = {};

    const result = await payment.processPayment(event);
    expect(result).toEqual({
      statusCode: 200,
      body: "{}",
    });
  });
});
