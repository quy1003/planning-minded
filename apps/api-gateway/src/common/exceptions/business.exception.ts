import { HttpException, HttpStatus } from "@nestjs/common";

export type BusinessErrorBody = {
  detail: string;
  category: "business";
  errors?: Array<{ path: string; message: string }>;
};

/**
 * Lỗi nghiệp vụ có chủ đích (email trùng, không đủ quyền domain...).
 * Filter sẽ gắn category=business; khác với 500 hệ thống.
 */
export class BusinessException extends HttpException {
  constructor(detail: string, status: HttpStatus = HttpStatus.BAD_REQUEST, errors?: BusinessErrorBody["errors"]) {
    const body: BusinessErrorBody = { detail, category: "business" };
    if (errors && errors.length > 0) {
      body.errors = errors;
    }
    super(body, status);
  }
}
