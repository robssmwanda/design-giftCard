export function discountPercent(denom, price) {
  if (denom <= 0) return 0;
  return Math.round((1 - price / denom) * 100);
}
