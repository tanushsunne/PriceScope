/**
 * Utility functions for Indian market formatting & retailer classification
 */

export const POPULAR_INDIAN_STORES_REGEX = /\b(amazon|flipkart|croma|reliance\s*digital|tata\s*cliq|tatacliq|vijay\s*sales|jiomart|jio|myntra|ajio|meesho|nykaa|bigbasket|blinkit|zepto|imagine\s*online|poorvika|sangeetha|apple|samsung|oneplus|mi\.com|realme)\b/i;

export const CROSS_BORDER_DROPSHIP_REGEX = /\b(ubuy|desertcart|papita|fruugo|tradeindia|grandado|fishpond)\b/i;

/**
 * Checks if a given store name is a prominent, trusted domestic Indian retailer
 */
export function isPopularIndianStore(sourceName: string): boolean {
  if (!sourceName) return false;
  return POPULAR_INDIAN_STORES_REGEX.test(sourceName) && !CROSS_BORDER_DROPSHIP_REGEX.test(sourceName);
}

/**
 * Checks if a store is an international cross-border importer / dropshipper
 * that artificially marks up products due to customs, import forwarding, etc.
 */
export function isCrossBorderStore(sourceName: string): boolean {
  if (!sourceName) return false;
  return CROSS_BORDER_DROPSHIP_REGEX.test(sourceName);
}

/**
 * Formats a numeric price into standard Indian Rupee (INR) representation
 * Example: 59900 -> "₹59,900"
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  // Round to nearest integer if no fractional cents
  const isWhole = Math.round(amount) === amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: isWhole ? 0 : 2,
    minimumFractionDigits: isWhole ? 0 : 2,
  }).format(amount);
}
