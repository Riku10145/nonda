import * as v from "valibot";

import { UuidSchema } from "../../utils/uuid.js";
import { TimingSchema } from "../medicines/timing.js";

/** POST /v1/medication-logs のリクエストボディ。 */
export const CreateMedicationLogsSchema = v.object({
  logs: v.pipe(
    v.array(
      v.object({
        medicine_id: UuidSchema,
        timing: TimingSchema,
        is_taken: v.boolean(),
      }),
    ),
    v.minLength(1),
  ),
  recorded_at: v.pipe(v.string(), v.isoTimestamp()),
});

export type CreateMedicationLogsInput = v.InferOutput<typeof CreateMedicationLogsSchema>;
