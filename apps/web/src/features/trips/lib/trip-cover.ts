const COLOR_VARIANTS = 6;
const ICON_VARIANTS = 6;

function hashString(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Băm tripId (+ "salt" riêng) → xác định, cùng id luôn ra cùng số — không dùng Math.random() để tránh đổi màu mỗi lần render. */
function coverIndex(tripId: string, salt: string, variants: number): number {
  return hashString(salt + tripId) % variants;
}

/** 0-5 — chọn 1 trong 6 gradient trang trí (`trip-cover-0..5` trong globals.css). Chỉ trang trí, không mang ý nghĩa category. */
export function tripCoverColorIndex(tripId: string): number {
  return coverIndex(tripId, "color:", COLOR_VARIANTS);
}

/** 0-5 — chọn 1 trong 6 icon trang trí, băm với salt khác màu nên 2 trip trùng màu vẫn thường khác icon (36 tổ hợp). */
export function tripCoverIconIndex(tripId: string): number {
  return coverIndex(tripId, "icon:", ICON_VARIANTS);
}
