# nonda

シンプルな薬服用記録アプリ

## 構成

```
nonda/
├── apps/
│   ├── web/   # フロントエンド (Next.js)
│   └── api/   # バックエンド (Hono)
└── packages/
    └── types/ # 共通型定義
```

## 技術スタック

| | 技術 |
|---|---|
| フロントエンド | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| バックエンド | Hono, TypeScript, Node.js |
| パッケージ管理 | pnpm |
| Linter | oxlint |
| Formatter | oxfmt |
| Git hooks | lefthook |

## セットアップ

```bash
pnpm install
```

## 開発

```bash
# web (localhost:3000)
pnpm --filter web dev

# api (localhost:8080)
pnpm --filter api dev
```
