# apps/api

Hono + Cloudflare Workers のバックエンドAPI。

## ディレクトリ構成方針

### トップレベル（関心ごとに分割）

```
src/
  index.ts        - Hono エントリ
  routes/         - HTTP ハンドラ (薄く保ち、検証と業務ロジックは下位層へ委譲)
  schemas/        - 入出力スキーマ (valibot) ※未分離
  services/       - 業務ロジック / DB アクセス ※未分離
  db/             - Drizzle スキーマとクライアント (schema.ts, client.ts)
  utils/          - 横断ユーティリティ (jst.ts など)
  types/          - 共通型 ※未分離
drizzle/          - 生成済みマイグレーション SQL
bruno/            - Bruno API クライアント定義
```

### 命名・ファイル分割規約

- **1 概念 = 1 ファイル / 1 ディレクトリ**。ファイル名は概念名そのもの（例: `create.ts`, `list.ts`）。
- **機能ごとにディレクトリ化**して `index.ts` で barrel re-export（例: `routes/medicines/{create,list,index}.ts`）。
- **テストは共置**し、`<name>.test.ts` で実装ファイルの隣に置く。優先度は `services/` のユニット > `schemas/` のユニット > `routes/` の統合（`app.request()` で 1 エンドポイント 1〜2 ケース）。
- **private / モジュール内共有のヘルパーは `_` プレフィックス**（例: `_shared.ts`）。外部 export しない。
- ルートは検証 → サービス呼び出し → レスポンス整形のみ。SQL や複雑な分岐はサービス層に置く。

## 開発

```bash
pnpm dev          # localhost:8787 (doppler run -- wrangler dev / Doppler CLI 必須)
pnpm lint         # Lint
pnpm fmt          # Format (自動修正)
pnpm fmt:check    # Format チェックのみ
```

## DB / マイグレーション

```bash
pnpm db:generate  # schema.ts から SQL を生成
pnpm db:migrate   # 本番/Neon に適用 (doppler 経由で DATABASE_URL を注入)
pnpm db:studio    # Drizzle Studio
```

- スキーマ変更時は `db:generate` → `drizzle/` の差分を確認 → コミット → `db:migrate`。
- 直接 SQL を書かず、`src/db/schema.ts` を起点にする。

## コード規約

共通規約はルートの `CLAUDE.md` を参照。以下は API 固有。

- **`services/` の公開関数と `schemas/` の公開型には JSDoc** を書く（`@param` / `@returns`）。`routes/` のハンドラや `_` プレフィックスの内部関数には不要。

## ドメイン規約

- リクエスト / レスポンス検証は valibot + `@hono/standard-validator` を使い、ハンドラに直接書かず `schemas/` に分離する。
