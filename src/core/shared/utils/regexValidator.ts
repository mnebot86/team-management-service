export const validateWithRegex = (
  value: unknown,
  regex: RegExp,
): boolean => {
  if (typeof value !== 'string') return false;

  return regex.test(value);
};
