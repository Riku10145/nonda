import * as v from "valibot";

import { UUID_REGEX } from "../../utils/uuid.js";

/** DELETE /v1/medicines/:id のパスパラメータ。 */
export const DeleteMedicineParamSchema = v.object({
  id: v.pipe(v.string(), v.regex(UUID_REGEX)),
});

export type DeleteMedicineParam = v.InferOutput<typeof DeleteMedicineParamSchema>;
