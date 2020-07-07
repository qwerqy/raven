import { bodyValidator, delay } from "../src/utils";

jest.useFakeTimers();

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

describe("delay", () => {
  it("should resolve after 5000 seconds", () => {
    delay(5000);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000);
  });

  it("should resolve after 1000 seconds", () => {
    delay(1000);
    expect(setTimeout).toHaveBeenCalledTimes(2);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
  });
});
