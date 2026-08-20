import { z } from "zod";

/**
 * Tiền dạng string thập phân (vd "1000000" hoặc "1000000.50"), không âm, tối đa 2 chữ số lẻ.
 * Nhận string thay vì number để tránh sai số float của JS trước khi vào Prisma.Decimal
 * (vd 0.1 + 0.2 !== 0.3) — string đi thẳng vào Decimal, giữ chính xác tuyệt đối.
 * Dùng chung giữa trip-service (budget/estCost) và catalog-service (estCostMin/estCostMax).
 */
export const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "phải là chuỗi số thập phân không âm, tối đa 2 chữ số sau dấu phẩy");
