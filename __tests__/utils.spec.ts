import { bodyValidator } from "../src/utils";

describe("bodyValidator", () => {
  it("Should return true if body exists", () => {
    const body = {
      id: 123,
      name: null,
    };

    expect(bodyValidator(body)).toEqual(true);
  });
  it("Should return false if body is empty", () => {
    const body = {};

    expect(bodyValidator(body)).toEqual(false);
  });
});
