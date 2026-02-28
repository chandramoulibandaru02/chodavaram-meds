export const calculateFinalPrice = (price: number, discount: number): number => {
  return Math.round(price - (price * discount) / 100);
};

export const calculateSavings = (price: number, discount: number): number => {
  return Math.round((price * discount) / 100);
};

export const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString("en-IN")}`;
};
