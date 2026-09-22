import * as v from "valibot";

import { UuidSchema } from "../../utils/uuid.js";

/** GET / PATCH / DELETE /v1/medicines/:id のパスパラメータ。 */
export const MedicineIdParamSchema = v.object({
  id: UuidSchema,
});

export type MedicineIdParam = v.InferOutput<typeof MedicineIdParamSchema>;
