import { bodyValidator } from "./utils";

describe("bodyValidator", () => {
  it("Should return array with keys if one of the keys are falsy", () => {
    const data = {
      id: 123,
      name: null,
    };

    expect(bodyValidator(data)).toEqual([null, "name"]);
  });
  it("Should return array with nulls if no keys are false", () => {
    const data = {
      id: 123,
      name: "Box",
    };

    expect(bodyValidator(data)).toEqual([null, null]);
  });
});
