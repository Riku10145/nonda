# apps/web

Next.js 16 (App Router) + React 19 のフロントエンド。Auth.js でユーザー認証し、`apps/api`（Hono / Cloudflare Workers）を JWT で呼び出すサーバー側 BFF も兼ねる。

## 技術スタック

- Next.js 16 (App Router) / React 19 / TypeScript
- Mantine（UI ライブラリ）
- Auth.js (`next-auth@5` beta)
- `jose`（API への HS256 JWT 発行）
- Lint: `oxlint` / Format: `oxfmt`

## ディレクトリ構成方針

```
app/
  layout.tsx
  page.tsx
  login/page.tsx              - サインイン UI（Google）
  api/auth/[...nextauth]/route.ts - Auth.js のハンドラ
lib/
  api-client.ts               - apps/api への fetch ラッパー（server-only）
  api-jwt.ts                  - Auth.js セッション → HS256 JWT 発行
auth.ts                       - NextAuth() 本体
auth.config.ts                - Edge 対応の共通 config（providers / callbacks）
proxy.ts                      - ミドルウェア（authorized コールバックでルート保護）
```

### 命名・ファイル分割規約

- **1 概念 = 1 ファイル**。共通規約はルート `CLAUDE.md` を参照。
- **private / モジュール内共有のヘルパーは `_` プレフィックス**（例: `_baseUrl`）。外部 export しない。

## 開発

```bash
pnpm dev          # localhost:3000 (doppler run -- next dev / Doppler CLI 必須)
pnpm build        # ビルド
pnpm lint         # Lint
pnpm fmt          # Format (自動修正)
pnpm fmt:check    # Format チェックのみ
```

必要な環境変数（Doppler 管理）:

- `AUTH_SECRET` … Auth.js / API 共有の署名鍵。`api-jwt.ts` の HS256 にも使うため **apps/api と必ず同じ値**。
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` … Google OIDC。
- `API_URL` … `apps/api` のベース URL（末尾スラッシュなし）。

## 認証

- セッションは **JWT 戦略**（`session.strategy = "jwt"`）。`jwt` コールバックで `token.id = user.id`、`session` コールバックで `session.user.id` に展開する。
- `proxy.ts`（Next.js ミドルウェア）が `authorized` コールバックで未ログインを `/login` にリダイレクトする。`api / _next / favicon` は matcher で除外。
- サインイン UI は `/login`。`signIn("google", { redirectTo })` を呼ぶだけのクライアントコンポーネントで、`callbackUrl` クエリを尊重する。

## API 連携

- **サーバー側からのみ** `lib/api-client.ts` の `apiGet / apiPost / apiPut / apiPatch / apiDelete` を使う（`import "server-only"`）。クライアントコンポーネントから直接呼ばない。
- 呼び出しごとに `issueApiToken()` がセッションから `sub = users.id` の HS256 JWT（5 分）を発行し、`Authorization: Bearer` で送る。未ログインなら `ApiError(401, "UNAUTHORIZED", …)` を投げる。
- エラーは API 側の `{ error: { code, message } }` を `ApiError` に詰め直して throw。呼び出し側で `status / code` を分岐する。
- パスは `/api` プレフィックス込みで組み立てるため、引数には `/medicines` のようにリソースパスのみを渡す。

## UI

- UI ライブラリは **Mantine**。コンポーネント追加時は公式 docs を参照。

## コード規約

共通規約はルートの `CLAUDE.md` を参照。以下は web 固有。

- **Server / Client コンポーネントの境界**: API 呼び出し・秘密情報・DB アクセスは Server Component または Route Handler に置く。`"use client"` ファイルからは `lib/api-client.ts` を import しない（`server-only` で実行時にも落ちる）。
