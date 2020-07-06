export const bodyValidator = (data: { [key: string]: any }): any[] => {
  return Object.entries(data).map(([key, value]) => {
    if (!value) {
      return key;
    }
    return null;
  });
};
