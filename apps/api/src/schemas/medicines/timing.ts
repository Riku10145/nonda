import * as v from "valibot";

/** 服用タイミング (朝/昼/夕)。DB の `timing_enum` と一致。 */
export const TimingSchema = v.picklist(["morning", "afternoon", "evening"]);

export type Timing = v.InferOutput<typeof TimingSchema>;
