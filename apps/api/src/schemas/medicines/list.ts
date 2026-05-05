import * as v from "valibot";

/** GET /v1/medicines のクエリ。 `today=true` で当日ログを併せて返す。 */
export const ListMedicinesQuerySchema = v.object({
  today: v.optional(v.picklist(["true", "false"])),
});

export type ListMedicinesQuery = v.InferOutput<typeof ListMedicinesQuerySchema>;
