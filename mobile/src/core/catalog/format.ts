/**
 * Format integer cents (KZT) as the designer's price string, e.g. 39 900 ₸.
 * Tenge has no sub-unit in practice, so we render whole tenge with
 * thin/space grouping the way ru-RU does.
 */
export function formatKzt(cents: number): string {
  const tenge = Math.round(cents / 100);
  return `${tenge.toLocaleString("ru-RU")} ₸`;
}

/** Round course length (stored in minutes) to whole hours for card meta. */
export function durationHours(minutes: number): number {
  return Math.max(1, Math.round(minutes / 60));
}
