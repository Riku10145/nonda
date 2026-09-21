import * as v from "valibot";

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** UUID 文字列。パスの id と medicine_id が同じ規則を使う。 */
export const UuidSchema = v.pipe(v.string(), v.regex(UUID_REGEX));
