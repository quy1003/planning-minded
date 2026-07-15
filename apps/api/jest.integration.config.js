/** Jest config riêng cho integration — không lẫn với `pnpm test` (unit). */
module.exports = {
  rootDir: ".",
  testRegex: ".*\\.integration-spec\\.ts$",
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  moduleFileExtensions: ["js", "json", "ts"],
  testTimeout: 120000,
  // Chạy tuần tự: tránh nhiều container/Docker race.
  maxWorkers: 1,
};
