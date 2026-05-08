import * as v from "valibot";

/** GET /v1/medication-logs のクエリ。 from / to は JST 基準の "YYYY-MM-DD"。 */
export const ListMedicationLogsQuerySchema = v.object({
  from: v.pipe(v.string(), v.isoDate()),
  to: v.pipe(v.string(), v.isoDate()),
});

export type ListMedicationLogsQuery = v.InferOutput<typeof ListMedicationLogsQuerySchema>;
