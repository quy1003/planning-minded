import { SetMetadata } from "@nestjs/common";

/** Metadata key — TransformInterceptor đọc để bỏ qua bọc `{ data }`. */
export const SKIP_RESPONSE_TRANSFORM_KEY = "skipResponseTransform";

/**
 * Dùng cho response phải giữ đúng shape chuẩn bên ngoài API của mình
 * (vd JWKS: `{ keys: [...] }`, không phải `{ data: { keys: [...] } }`).
 */
export const SkipResponseTransform = () => SetMetadata(SKIP_RESPONSE_TRANSFORM_KEY, true);
