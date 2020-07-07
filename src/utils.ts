export const bodyValidator = (body: { [key: string]: any }): boolean => {
  return !(
    !body ||
    (Object.keys(body).length === 0 && body.constructor === Object)
  );
};

export const delay = (t: number) => {
  return setTimeout(function () {}, t);
};
