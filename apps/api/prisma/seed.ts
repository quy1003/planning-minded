// apps/api không còn model nào (trip đã tách sang apps/trip-service, task #2 Phase 3 —
// xem docs/learning/48-trip-service-extraction.md). catalog/ hiện là module rỗng, chưa
// có model — chưa có gì để seed. File này sẽ có nội dung thật khi task #3
// (docs/learning/49-catalog-service.md) xây catalog-service.
async function main(): Promise<void> {
  console.log("apps/api: chưa có model nào để seed — xem docs/learning/49-catalog-service.md.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
