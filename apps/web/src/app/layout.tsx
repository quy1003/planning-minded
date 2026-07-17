import type { ReactNode } from "react";

/**
 * Root layout bắt buộc — html/body nằm ở `[locale]/layout`
 * (next-intl cần `lang` theo locale).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
