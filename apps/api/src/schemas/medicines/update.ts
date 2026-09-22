import * as v from "valibot";

import { MedicineNameSchema } from "./name.js";
import { TimingsSchema } from "./timing.js";

/** PATCH /v1/medicines/:id のリクエストボディ（部分更新）。 */
export const UpdateMedicineSchema = v.pipe(
  v.object({
    name: v.optional(MedicineNameSchema),
    timings: v.optional(TimingsSchema),
  }),
  v.check(
    (input) => input.name !== undefined || input.timings !== undefined,
    "更新するフィールドを少なくとも1つ指定してください",
  ),
);

export type UpdateMedicineInput = v.InferOutput<typeof UpdateMedicineSchema>;
