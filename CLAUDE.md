# CLAUDE.md

## プロジェクト概要

薬服用記録アプリ「nonda」のモノレポ。pnpm workspacesで管理。

```
apps/web   - Next.js 16 (App Router) フロントエンド
apps/api   - Hono バックエンド (Cloudflare Workers / wrangler dev は 8787)
packages/types - 共通型定義（未実装）
```

## よく使うコマンド

```bash
# 依存インストール
pnpm install

# 開発サーバー
pnpm --filter web dev   # localhost:3000
pnpm --filter api dev   # localhost:8787 (doppler run -- wrangler dev / Doppler CLI が必要)

# Lint / Format (web)
pnpm --filter web lint:oxlint   # oxlint
pnpm --filter web fmt           # oxfmt (自動修正)
pnpm --filter web fmt:check     # oxfmt (チェックのみ)

# Lint / Format (api)
pnpm --filter api lint:oxlint   # oxlint
pnpm --filter api fmt           # oxfmt (自動修正)
pnpm --filter api fmt:check     # oxfmt (チェックのみ)
```
