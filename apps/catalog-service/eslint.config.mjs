import { baseConfig } from "@tripmind/config/eslint-preset.mjs";

export default [
  ...baseConfig,
  {
    // Prisma Client tự sinh — không phải code mình viết, output nằm trong src/
    // (không phải node_modules) vì cần output riêng tránh dedupe pnpm giữa 2 app.
    ignores: ["jest.integration.config.js", "src/generated/**"],
  },
];
