/**
 * Calculate discount percentage from MRP and selling price.
 * Returns value rounded to 2 decimal places.
 */
export const calculateDiscountPercent = (mrp: number, sellingPrice: number): number => {
  if (mrp <= 0 || sellingPrice <= 0 || sellingPrice > mrp) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 10000) / 100;
};

/**
 * Calculate final (selling) price from MRP and discount percentage.
 * Legacy support for old data that stores discount as percentage.
 */
export const calculateFinalPrice = (price: number, discount: number): number => {
  return Math.round(price - (price * discount) / 100);
};

export const calculateSavings = (price: number, discount: number): number => {
  return Math.round((price * discount) / 100);
};

export const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString("en-IN")}`;
};

/**
 * Get display discount from a product object.
 * Supports both new (mrp + sellingPrice) and legacy (price + discount) formats.
 */
export const getProductDiscount = (product: { mrp?: number; sellingPrice?: number; price?: number; discount?: number }): number => {
  if (product.mrp && product.sellingPrice) {
    return calculateDiscountPercent(product.mrp, product.sellingPrice);
  }
  return product.discount || 0;
};

/**
 * Get display MRP from a product object (supports both formats).
 */
export const getProductMRP = (product: { mrp?: number; price?: number }): number => {
  return product.mrp || product.price || 0;
};

/**
 * Get display selling price from a product object (supports both formats).
 */
export const getProductSellingPrice = (product: { mrp?: number; sellingPrice?: number; price?: number; discount?: number; finalPrice?: number }): number => {
  if (product.sellingPrice) return product.sellingPrice;
  if (product.finalPrice) return product.finalPrice;
  if (product.price && product.discount) return calculateFinalPrice(product.price, product.discount);
  return product.price || 0;
};
