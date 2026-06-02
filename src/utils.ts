/**
 * Formats a numeric count into a clean, social-media style shorthand string.
 * Example: 1259 -> "1.3K", 15000 -> "15K", 2300000 -> "2.3M", etc.
 */
export const formatCount = (num: number): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};
