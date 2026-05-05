import * as v from "valibot";

import { UUID_REGEX } from "../../utils/uuid.js";

/** GET /v1/medicines/:id のパスパラメータ。 */
export const GetMedicineParamSchema = v.object({
  id: v.pipe(v.string(), v.regex(UUID_REGEX)),
});

export type GetMedicineParam = v.InferOutput<typeof GetMedicineParamSchema>;
