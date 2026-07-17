/** Ngày lịch của dayNumber (1-based) từ startDate ISO `YYYY-MM-DD`. */
export function tripDayDate(startDate: string | null, dayNumber: number): Date | null {
  if (!startDate) return null;
  const base = new Date(`${startDate}T12:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + (dayNumber - 1));
  return base;
}

export function formatTripDayDate(startDate: string | null, dayNumber: number, locale: string): string | null {
  const date = tripDayDate(startDate, dayNumber);
  if (!date) return null;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(date);
}
