/** Format số tiền theo locale + currency (vd 1000000 → "1.000.000 ₫"). */
export function formatMoney(value: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.length === 3 ? currency : "VND",
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}
