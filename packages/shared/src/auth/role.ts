import { z } from "zod";

/**
 * Role user, mint vào JWT claim lúc `auth-service` ký access token — mọi service verify JWT
 * (JwtAuthGuard, duplicate ở từng service — xem docs/adr/008-auth-service-extraction.md) đọc
 * lại claim này để biết `request.jwtUser.role`. Contract chung giữa services nên khai báo ở
 * đây, không duplicate literal "USER"/"ADMIN" ở từng nơi.
 */
export const userRoleSchema = z.enum(["USER", "ADMIN"]);
export type UserRole = z.infer<typeof userRoleSchema>;
