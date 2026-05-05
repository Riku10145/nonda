import { sValidator } from "@hono/standard-validator";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { ValidationTargets } from "hono";

const _formatField = (path: StandardSchemaV1.Issue["path"]): string | undefined => {
  if (!path || path.length === 0) return undefined;
  return path.map((segment) => (typeof segment === "object" ? segment.key : segment)).join(".");
};

/**
 * sValidator のラッパー。バリデーション失敗時に統一エラーフォーマット
 * (`{ error: { code, message, details } }`) で 422 を返す。
 */
export const validator = <Schema extends StandardSchemaV1, Target extends keyof ValidationTargets>(
  target: Target,
  schema: Schema,
) =>
  sValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "入力値が不正です",
            details: result.error.map((issue) => ({
              field: _formatField(issue.path),
              message: issue.message,
            })),
          },
        },
        422,
      );
    }
  });
