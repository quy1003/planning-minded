import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * Browser gọi same-origin `/api/v1/*` trên web (:3001).
 * Phase 3 task #4: `api-gateway` là cửa ngõ DUY NHẤT — Next chỉ còn 1 rule rewrite, không
 * còn tự biết route nào đi service nào nữa (routing table đó giờ nằm trong
 * apps/api-gateway/src/proxy/proxy.controller.ts). Trước đó (task #1-#3) `apps/web` tự
 * rewrite thẳng tới từng service — xem lại git history nếu cần đối chiếu.
 * Vẫn same-origin từ góc nhìn browser → cookie refresh token httpOnly hoạt động đúng dù
 * thật ra có nhiều service đứng sau gateway.
 */
const apiGatewayInternalUrl = process.env.API_GATEWAY_INTERNAL_URL ?? "http://localhost:3008";

const nextConfig: NextConfig = {
  transpilePackages: ["@tripmind/shared"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiGatewayInternalUrl}/v1/:path*`,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
