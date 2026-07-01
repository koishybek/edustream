/** Round course length (stored in minutes) to whole hours for card meta. */
export function durationHours(minutes: number): number {
  return Math.max(1, Math.round(minutes / 60));
}
