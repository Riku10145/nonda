import { sValidator } from "@hono/standard-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import * as v from "valibot";

import { createDb } from "../db/client.js";
import { medicines, medicineTimings } from "../db/schema.js";

type Bindings = {
  DATABASE_URL: string;
};

type Variables = {
  userId: string;
};
//Todo: 汎用的な定数はここで良いのか検討する
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
//Todo: スキーマの定義はこのファイル内で良いか
const TimingSchema = v.picklist(["morning", "afternoon", "evening"]);

const CreateMedicineSchema = v.object({
  //Todo: nameの最大長は255だと無駄かなと思う。もっと短くても良いかも
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255)),
  timings: v.pipe(v.array(TimingSchema), v.minLength(1)),
  photo_url: v.optional(v.pipe(v.string(), v.url())),
});

export const medicinesRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 認証スタブ: x-user-id ヘッダで userId を受け取る。本番では Auth.js セッション検証に差し替える。
//Todo: ブラウザから叩く前に index.ts の CORS allowHeaders に x-user-id を追加する（現状は Bruno など非ブラウザのみ動作）
medicinesRoute.use("*", async (c, next) => {
  const userId = c.req.header("x-user-id");
  if (!userId || !UUID_REGEX.test(userId)) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "ログインが必要です" } }, 401);
  }
  c.set("userId", userId);
  await next();
});

medicinesRoute.post("/", sValidator("json", CreateMedicineSchema), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const db = createDb(c.env.DATABASE_URL);

  const uniqueTimings = [...new Set(body.timings)];
  const medicineId = crypto.randomUUID();

  await db.batch([
    db.insert(medicines).values({
      id: medicineId,
      userId,
      name: body.name,
      photoUrl: body.photo_url ?? null,
    }),
    db.insert(medicineTimings).values(
      uniqueTimings.map((timing) => ({
        medicineId,
        timing,
      })),
    ),
  ]);

  const [created] = await db.select().from(medicines).where(eq(medicines.id, medicineId));

  return c.json(
    {
      id: created.id,
      name: created.name,
      timings: uniqueTimings,
      photo_url: created.photoUrl,
      created_at: created.createdAt,
    },
    201,
  );
});
