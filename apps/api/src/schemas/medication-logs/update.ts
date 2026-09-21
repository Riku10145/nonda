import * as v from "valibot";

import { UuidSchema } from "../../utils/uuid.js";

/** PATCH /v1/medication-logs/:id のパスパラメータ。 */
export const UpdateMedicationLogParamSchema = v.object({
  id: UuidSchema,
});

export type UpdateMedicationLogParam = v.InferOutput<typeof UpdateMedicationLogParamSchema>;

/** PATCH /v1/medication-logs/:id のリクエストボディ。 */
export const UpdateMedicationLogSchema = v.object({
  is_taken: v.boolean(),
});

export type UpdateMedicationLogInput = v.InferOutput<typeof UpdateMedicationLogSchema>;
