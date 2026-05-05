import * as v from "valibot";

import { TimingSchema } from "./timing.js";

/** POST /v1/medicines のリクエストボディ。 */
//Todo: nameの最大長は255だと無駄かなと思う。もっと短くても良いかも
export const CreateMedicineSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255)),
  timings: v.pipe(v.array(TimingSchema), v.minLength(1)),
  photo_url: v.optional(v.pipe(v.string(), v.url())),
});

export type CreateMedicineInput = v.InferOutput<typeof CreateMedicineSchema>;
