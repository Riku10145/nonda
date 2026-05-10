# CLAUDE.md

## プロジェクト概要

薬服用記録アプリ「nonda」のモノレポ。pnpm workspaces で管理。

```
apps/web        - Next.js 16 (App Router) フロントエンド (→ apps/web/CLAUDE.md)
apps/api        - Hono / Cloudflare Workers バックエンド (→ apps/api/CLAUDE.md)
packages/db     - 共通 DB スキーマ (Drizzle)。apps/api と apps/web の双方から参照
```

各アプリの開発コマンド・規約は各 `CLAUDE.md` を参照。

## ルートで使うコマンド

```bash
pnpm install                # 依存インストール
pnpm --filter web dev       # web 開発サーバー (localhost:3000)
pnpm --filter api dev       # api 開発サーバー (localhost:8787)
```

## 共通コード規約

- **オブジェクト形は `interface`**、ユニオン / エイリアスのみ `type`。
- **private / モジュール内共有のシンボルは `_` プレフィックス**（例: `_shared.ts`）。外部 export しない。
- **GitHub 操作は `gh` CLI** を優先（PR・Issue・チェック等）。
