import { z } from "zod";

/** Body đăng ký — dùng chung api + (sau này) web form. */
export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Password phải có ít nhất 8 ký tự"),
  name: z.string().min(1).max(100).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** Body đăng nhập — cùng rule password tối thiểu để reject sớm ở biên. */
export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Password phải có ít nhất 8 ký tự"),
});

export type LoginInput = z.infer<typeof loginSchema>;
