import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * Browser gọi same-origin `/api/*` trên web (:3001).
 * Next rewrite sang 2 backend khác nhau (Phase 2 task #7 — auth tách service riêng):
 * `/api/auth/*` → auth-service (:3002), còn lại → apps/api (:3000).
 * Vẫn same-origin từ góc nhìn browser → cookie refresh token httpOnly hoạt động
 * đúng dù thật ra có 2 service backend khác nhau đứng sau.
 */
const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3000";
const authServiceInternalUrl = process.env.AUTH_SERVICE_INTERNAL_URL ?? "http://localhost:3002";

const nextConfig: NextConfig = {
  transpilePackages: ["@tripmind/shared"],
  async rewrites() {
    return [
      // Cụ thể hơn phải đứng TRƯỚC rule chung /api/:path* bên dưới — Next.js match
      // theo thứ tự khai báo, rule đầu tiên khớp sẽ thắng.
      {
        source: "/api/auth/:path*",
        destination: `${authServiceInternalUrl}/auth/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${apiInternalUrl}/:path*`,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
