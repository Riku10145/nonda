import * as v from "valibot";

import { MedicineNameSchema } from "./name.js";
import { TimingsSchema } from "./timing.js";

/** POST /v1/medicines のリクエストボディ。 */
export const CreateMedicineSchema = v.object({
  name: MedicineNameSchema,
  timings: TimingsSchema,
});

export type CreateMedicineInput = v.InferOutput<typeof CreateMedicineSchema>;
