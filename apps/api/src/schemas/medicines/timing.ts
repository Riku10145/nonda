import * as v from "valibot";

/** 服用タイミング (朝/昼/夕)。DB の `timing_enum` と一致。 */
export const TimingSchema = v.picklist(["morning", "afternoon", "evening"]);

export type Timing = v.InferOutput<typeof TimingSchema>;

/** 1 件以上の服用タイミング。重複はここでは拒まず、保存時に先勝ちで除く。 */
export const TimingsSchema = v.pipe(v.array(TimingSchema), v.minLength(1));
