import * as v from "valibot";

/** 薬の名前。前後の空白を除き、1 文字以上 255 文字以下。 */
export const MedicineNameSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255));
