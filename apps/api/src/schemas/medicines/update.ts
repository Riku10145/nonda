import * as v from "valibot";

import { UUID_REGEX } from "../../utils/uuid.js";
import { TimingSchema } from "./timing.js";

/** PATCH /v1/medicines/:id のパスパラメータ。 */
export const UpdateMedicineParamSchema = v.object({
  id: v.pipe(v.string(), v.regex(UUID_REGEX)),
});

export type UpdateMedicineParam = v.InferOutput<typeof UpdateMedicineParamSchema>;

/** PATCH /v1/medicines/:id のリクエストボディ（部分更新）。 */
export const UpdateMedicineSchema = v.pipe(
  v.object({
    name: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255))),
    timings: v.optional(v.pipe(v.array(TimingSchema), v.minLength(1))),
  }),
  v.check(
    (input) => input.name !== undefined || input.timings !== undefined,
    "更新するフィールドを少なくとも1つ指定してください",
  ),
);

export type UpdateMedicineInput = v.InferOutput<typeof UpdateMedicineSchema>;
