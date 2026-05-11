# ui-demo skill

PR レビュー用に、UI 変更箇所のスクショ・操作デモ動画を Playwright で自動生成する Claude Code skill。

## トリガー

Claude Code 上で以下のように頼むと起動する:

- 「PR デモ作って」
- 「UI デモ生成」
- 「スクショ撮って」
- 「ログイン画面の操作動画撮って」

## 初回セットアップ

ホスト側に Playwright を入れる（プロジェクトの devDependencies でも、グローバルでも可）。

```bash
npm i -D playwright tsx
npx playwright install chromium
```

`ui-demo-output/` は成果物ディレクトリ。`.gitignore` に追加推奨:

```
ui-demo-output/
```

## 使い方の最小手順

1. UI を変更したブランチで Claude Code を起動
2. 「UI デモ作って」と頼む
3. Claude が**自動で**:
   - `git diff origin/main...HEAD` で変更を検出
   - 影響ルートを推定（確認は取らない）
   - dev サーバの死活確認 → 落ちていれば自動起動（撮影後に自分で kill）
   - `ui-demo-output/_run.ts` を生成して `npx tsx` で実行
   - スクショと PR 本文用 Markdown を出力
4. **動画も欲しい場合のみ**「操作動画も撮って」と追加で頼む。シナリオ（何をクリック/入力するか）だけ聞かれる
5. 出力された画像/動画を GitHub の PR コメント欄にドラッグ&ドロップでアップロード

## 動作確認（ダミー）

dev サーバが起動した状態で:

```
Claude に「http://localhost:3000 のトップを撮って」と頼む
```

`ui-demo-output/screenshots/*.png` と `ui-demo-output/videos/*.webm` が生成されれば OK。

## ファイル構成

```
.claude/skills/ui-demo/
  SKILL.md                       # ワークフロー本体
  README.md                      # このファイル
  references/
    playwright-recipe.md         # _run.ts の定型・録画設定・ハマり所
    selector-strategy.md         # data-testid 優先などのセレクター指針
```

## スコープ外（将来検討）

- YAML 台本 DSL（再撮影運用が定着したら）
- 赤枠ハイライト / annotation DOM 差し込み
- mp4 / GIF 変換（ffmpeg 必須になるので保留）
- before/after 比較
- `gh` 経由での画像自動アップロード
