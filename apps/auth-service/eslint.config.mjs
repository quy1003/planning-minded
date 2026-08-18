import { baseConfig } from "@tripmind/config/eslint-preset.mjs";

export default [
  ...baseConfig,
  {
    // scripts/: chạy tay 1 lần, không phải code app. src/generated/: Prisma Client
    // tự sinh, output nằm trong src/ (không phải node_modules) để tránh dedupe pnpm.
    ignores: ["jest.integration.config.js", "scripts/**", "src/generated/**"],
  },
];
