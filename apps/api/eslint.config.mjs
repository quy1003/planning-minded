import { baseConfig } from "@tripmind/config/eslint-preset.mjs";

export default [
  ...baseConfig,
  {
    // Script tiện ích chạy tay 1 lần (sinh khóa JWT) — không phải code app, không cần lint như src/.
    ignores: ["jest.integration.config.js", "scripts/**"],
  },
];
