---
name: api-verify
description: apps/api の変更点を curl で動作確認し、結果を現ブランチの PR に 2 件のコメント（詳細＋サマリー）として投稿する。ユーザーが `/api-verify` を明示実行した時のみ動作。
disable-model-invocation: true
argument-hint: "[METHOD PATH] (省略時は git diff から推測)"
allowed-tools: Bash(curl:*), Bash(gh:*), Bash(git:*), Bash(jq:*), Read, Grep, Glob
---

# api-verify

`apps/api` で実装した API エンドポイントを curl で叩き、結果を現ブランチの PR に投稿する。

## 前提

- 開発サーバーが `http://localhost:8787` で起動済み（`pnpm --filter api dev`、Doppler 必須）。**自動起動はしない。**
- 現ブランチに紐づく GitHub PR が存在する（`gh pr view` で取得できる）。
- `gh` CLI 認証済み。

## 認証ヘッダ（差し替えポイント）

現状はスタブ。Bruno の devUserId をそのまま使う:

```
x-user-id: 87d8b9c6-00e8-42aa-ae8c-7d0e83aa2fb7
```

> 🔧 **将来差し替え**: Auth.js セッションが入ったら、ここを `Cookie: ...` または `Authorization: Bearer ...` に変更する。`apps/api/src/routes/medicines/index.ts` の認証スタブが本実装に置き換わったタイミングが目安。

## 実行手順

### 1. PR 番号を取得

```bash
gh pr view --json number,headRefName,url -q '{number, branch: .headRefName, url}'
```

PR が存在しなければ「現ブランチに紐づく PR がありません」と報告して終了。

### 2. 対象エンドポイントを決定

**引数あり** (`/api-verify POST /v1/medicines`): その method+path を使用。

**引数なし**:
1. `git diff origin/main...HEAD --name-only -- 'apps/api/src/routes/**'` で変更ファイルを取得。
2. 変更が無ければ「API の変更が無いため終了します」と報告して終了。
3. 各ファイルから method+path を読み取る（`app.get(...)`, `app.post(...)` 等）。Hono のルートは `apps/api/src/index.ts` で `/api` プレフィックスが付くので、最終的なパスは `/api/v1/...` となる。
4. 推測した一覧をユーザーに提示し「これで実行しますか？」と確認。

### 3. 開発サーバーの疎通確認

```bash
curl -fsS -o /dev/null -w '%{http_code}' http://localhost:8787/health
```

`200` 以外なら「`pnpm --filter api dev` を起動してください」と報告して終了。

### 4. リクエストボディを準備（POST/PUT/PATCH）

1. `apps/api/src/schemas/<feature>/...` または `apps/api/src/routes/<feature>/...` から valibot スキーマを読む。
2. スキーマからサンプルボディを生成し、ユーザーに提示して確認。
3. 既存の `apps/api/bruno/<feature>/*.bru` があればそれをベースにすると速い。

### 5. curl 実行

各エンドポイントにつき:

```bash
curl -sS -i \
  -X <METHOD> 'http://localhost:8787/api/v1/<path>' \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: 87d8b9c6-00e8-42aa-ae8c-7d0e83aa2fb7' \
  -w '\n---TIMING---\n%{http_code} %{time_total}\n' \
  $( [ -n "$BODY" ] && echo "-d $BODY" )
```

レスポンス本体・ステータスコード・所要時間を保存。

### 6. PR にコメント投稿（2 件、詳細 → サマリーの順）

#### コメント 1: 詳細

```markdown
## 🔍 API 動作確認 (`<sha-short>`)

### `<METHOD> /api/v1/<path>` → **<status>** (<time>s)

<details><summary>Request</summary>

​```http
<METHOD> /api/v1/<path> HTTP/1.1
Host: localhost:8787
Content-Type: application/json
x-user-id: 87d8b9c6-...

<body or 空>
​```

</details>

**Response**

​```json
<整形済み response body>
​```

---

(以降エンドポイントごとに繰り返し)
```

投稿:

```bash
gh pr comment <PR#> --body-file /tmp/api-verify-detail.md
```

投稿後、レスポンスから URL を取り出してサマリーで参照:

```bash
gh api "repos/{owner}/{repo}/issues/<PR#>/comments" --jq '.[-1].html_url'
```

#### コメント 2: サマリー

全件成功なら ✅、1 件でも 4xx/5xx があれば ⚠️ をタイトルに。

```markdown
## ✅ API 動作確認サマリー (`<sha-short>`)

| Method | Endpoint | Status | Time |
|---|---|---|---|
| PUT | `/api/v1/notification-settings` | ✅ 200 | 0.04s |
| GET | `/api/v1/medicines` | ✅ 200 | 0.02s |
| POST | `/api/v1/medicines` | ⚠️ 400 | 0.01s |

詳細: <詳細コメント URL>
```

失敗があってもそのまま投稿する（事前確認しない）。

```bash
gh pr comment <PR#> --body-file /tmp/api-verify-summary.md
```

### 7. 完了報告

ユーザーに「2 件のコメントを PR #<num> に投稿しました」と URL 付きで伝える。

## 重要な制約

- **重複投稿の整理はしない**。同 skill を複数回叩いた場合、過去のコメントはそのまま残す（commit SHA で識別可能）。
- **サーバーの自動起動はしない**。Doppler が必要なため。
- **失敗しても投稿は止めない**。記録として残す。
- **API 変更がない & 引数もない場合は何もせず終了**。エラーではない。
