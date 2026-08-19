import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * Browser gọi same-origin `/api/v1/*` trên web (:3001).
 * Next rewrite sang 2 backend khác nhau (Phase 2 task #7 — auth tách service riêng):
 * `/api/v1/auth/*` → auth-service (:3002), còn lại → apps/api (:3000).
 * Vẫn same-origin từ góc nhìn browser → cookie refresh token httpOnly hoạt động
 * đúng dù thật ra có 2 service backend khác nhau đứng sau.
 *
 * "/api" là namespace riêng của Next (phân biệt request API vs page route) — không liên
 * quan version. "v1" là NestJS URI versioning thật (`app.enableVersioning(...)`, xem
 * apps/api|auth-service/src/bootstrap/configure-app.ts) — mỗi service tự mang "v1" trong
 * route của chính nó, nên destination dưới đây khớp thẳng "/v1/...", không cần tự strip/gán
 * version ở đây nữa. Xem docs/learning/47-api-versioning.md.
 */
const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3000";
const authServiceInternalUrl = process.env.AUTH_SERVICE_INTERNAL_URL ?? "http://localhost:3002";

const nextConfig: NextConfig = {
  transpilePackages: ["@tripmind/shared"],
  async rewrites() {
    return [
      // Cụ thể hơn phải đứng TRƯỚC rule chung /api/v1/:path* bên dưới — Next.js match
      // theo thứ tự khai báo, rule đầu tiên khớp sẽ thắng.
      {
        source: "/api/v1/auth/:path*",
        destination: `${authServiceInternalUrl}/v1/auth/:path*`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${apiInternalUrl}/v1/:path*`,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
