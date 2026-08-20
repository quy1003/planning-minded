import { baseConfig } from "@tripmind/config/eslint-preset.mjs";

export default [
  ...baseConfig,
  {
    ignores: ["jest.integration.config.js"],
  },
];
