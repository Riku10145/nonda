---
name: ui-demo
description: PRのUI変更に対してスクショ・操作デモ動画をPlaywrightで自動生成するスキル。「PRデモ作って」「UIデモ生成」「スクショ撮って」「操作動画撮って」「レビュー用の画面キャプチャ」など、PRレビュー向けに画面キャプチャや操作デモ動画を作りたいという要望が出たら必ずこのスキルを起動する。Next.js / React プロジェクトでのフロントレビュー運用を想定。
---

# ui-demo skill

UI 実装の PR をレビューするとき、レビュアーが dev サーバを立ち上げなくて済むように、変更箇所のスクショ・操作デモ動画を `ui-demo-output/` に出力する。

**前提**: `references/playwright-recipe.md` を必ず最初に読む。Playwright スクリプトの定型・録画設定・localhost ガードはそこに集約。セレクター戦略は `references/selector-strategy.md`。

## 自動化方針

- **聞かずに進める**: 変更検出・ルート推定・dev サーバ起動・スクショ撮影までは自動。
- **聞くのは「操作シナリオ」だけ**: 動画を撮るには「何をクリックして何を見せるか」の意図が必要。ユーザが「動画も」「操作デモも」と明示しなければ **スクショのみ** で完結する。
- **不可逆な操作はしない**: 撮影は読み取り専用。ログイン以外のフォーム送信、削除ボタンなどは明示指示があるときだけ。

## ワークフロー

### 1. 変更検出（自動）

```bash
git diff --name-only origin/main...HEAD | grep -E '\.(tsx|jsx)$' | grep -E '(app/|components/|pages/)'
```

該当なしなら「UI 変更が見当たらない」と報告して終了。

### 2. 影響ルートの推定（自動）

- App Router: `apps/web/app/<path>/page.tsx` → `/<path>`（`(group)` セグメントは除去、`[param]` はユーザに値を聞くかダミーで撮る判断をログに残してスキップ）
- 共通コンポーネント変更時: `grep -rl "ComponentName"` で import 元の page を逆引き
- 推定結果は「これらを撮ります: /login, /dashboard」と一行で報告するだけ。**確認は取らない**

### 3. dev サーバ自動起動（自動）

```bash
# 死活確認
curl -sf -o /dev/null http://localhost:3000 && echo "up" || echo "down"
```

- `up` ならそのまま使う（既存サーバを尊重）
- `down` なら `pnpm --filter web dev` を `run_in_background` で起動
- 起動後、最大 60 秒ポーリングして 200 が返るのを待つ
- **自分で起動した場合のみ** 最後に kill する。既存サーバは触らない
- 起動 PID は変数で保持: `OUR_DEV_PID=...`

### 4. Playwright 実行（自動）

- `references/playwright-recipe.md` のテンプレで `ui-demo-output/_run.ts` を生成
- 各ルートに対して `goto` → `screenshot` のループ
- ユーザが「動画も」「操作デモ」と言った場合のみ、シナリオを聞いた上で `click` / `fill` を含むスクリプトを追記
- `npx tsx ui-demo-output/_run.ts` で実行
- URL は `localhost` / `127.0.0.1` / `.test` のみ許可（recipe の `assertSafeUrl()`）

### 5. Markdown 生成（自動）

PR 本文用スニペットを表示:

```markdown
## UI デモ

| ルート | スクショ |
|---|---|
| /login | ![login](ui-demo-output/screenshots/login.png) |
| /dashboard | ![dashboard](ui-demo-output/screenshots/dashboard.png) |

<!-- 動画がある場合 -->
### 操作デモ
GitHub の PR コメント欄に `ui-demo-output/videos/flow.webm` をドラッグ&ドロップしてアップロードしてください。
```

### 6. 後処理（自動）

- `_run.ts` を削除
- 自分で起動した dev サーバを kill（`kill $OUR_DEV_PID`）
- 出力ファイルパス一覧を報告

## ユーザに必ず聞くこと

- **動画シナリオ**: 「操作動画も」と言われたとき、何をクリック/入力するか。例: 「ログインフォームに demo@example.com を入れて送信ボタンを押す流れでいい？」
- **`[param]` ルート**: 動的セグメントがあって、撮るべき具体値が diff から読めないとき
- **`data-testid` 追加の可否**: セレクターが安定しないとき（`references/selector-strategy.md` 参照）

それ以外は聞かない。

## やらないこと（MVP スコープ外）

- YAML 台本 DSL
- 赤枠ハイライト / annotation DOM 差し込み
- ffmpeg 経由の mp4/GIF 変換
- before/after 比較
- `gh` 経由での画像自動アップロード（API が不安定なので手動）

## 初回セットアップ

Playwright が未インストールならユーザに案内:

```bash
npm i -D playwright tsx
npx playwright install chromium
```

詳細は `README.md`。
