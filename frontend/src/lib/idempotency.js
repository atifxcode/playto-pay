export const generateIdempotencyKey = () => {
  return crypto.randomUUID();
};
