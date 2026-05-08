import * as v from "valibot";

import { UUID_REGEX } from "../../utils/uuid.js";

/** PATCH /v1/medication-logs/:id のパスパラメータ。 */
export const UpdateMedicationLogParamSchema = v.object({
  id: v.pipe(v.string(), v.regex(UUID_REGEX)),
});

export type UpdateMedicationLogParam = v.InferOutput<typeof UpdateMedicationLogParamSchema>;

/** PATCH /v1/medication-logs/:id のリクエストボディ。 */
export const UpdateMedicationLogSchema = v.object({
  is_taken: v.boolean(),
});

export type UpdateMedicationLogInput = v.InferOutput<typeof UpdateMedicationLogSchema>;
