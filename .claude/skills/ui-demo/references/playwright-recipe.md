# Playwright レシピ

`ui-demo-output/_run.ts` を生成するときの定型。コピペベースで OK、必要な箇所だけ書き換える。

## 必須要件

- **URL ガード**: `goto` 前に `assertSafeUrl()` を通す。`localhost` / `127.0.0.1` / `.test` 以外は throw。
- **録画**: `context` 単位で `recordVideo` を指定。`page.close()` 後に `.webm` がフラッシュされる。
- **スクショ**: `page.screenshot({ path, fullPage: true })`。命名は `<route>-<state>.png`。
- **viewport**: デフォルト 1280x800。モバイル確認が必要なら別 context で。
- **headless**: true 固定（CI でも動くように）。

## テンプレ

```ts
// ui-demo-output/_run.ts
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = "ui-demo-output";
const SHOTS = join(OUT, "screenshots");
const VIDEOS = join(OUT, "videos");
mkdirSync(SHOTS, { recursive: true });
mkdirSync(VIDEOS, { recursive: true });

function assertSafeUrl(url: string) {
  const u = new URL(url);
  const ok =
    u.hostname === "localhost" ||
    u.hostname === "127.0.0.1" ||
    u.hostname.endsWith(".test");
  if (!ok) throw new Error(`unsafe url: ${url}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: VIDEOS, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();

  // --- ここから個別シナリオ ---

  const loginUrl = "http://localhost:3000/login";
  assertSafeUrl(loginUrl);
  await page.goto(loginUrl, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(SHOTS, "login.png"), fullPage: true });

  // 例: フォーム入力 → 送信
  // await page.getByTestId("email").fill("demo@example.com");
  // await page.getByRole("button", { name: "ログイン" }).click();
  // await page.waitForURL("**/dashboard");
  // await page.screenshot({ path: join(SHOTS, "dashboard.png"), fullPage: true });

  // --- ここまで ---

  await page.close();
  await context.close();
  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## 実行

```bash
npx tsx ui-demo-output/_run.ts
```

## よくあるハマり

- **動画が 0 バイト**: `context.close()` 前に `page.close()` していない。順序を守る。
- **`networkidle` で固まる**: SSE / WebSocket があると永遠に idle にならない。`domcontentloaded` + 明示的な `waitForSelector` に切り替える。
- **Next.js の初回ビルドで遅い**: `goto` のタイムアウトを 60s 程度に伸ばす（`{ timeout: 60_000 }`）。
- **dev サーバが落ちている**: スクリプト先頭で `fetch("http://localhost:3000")` して死活確認するのも手。

## 出力後の掃除

`_run.ts` は使い捨て。実行後に削除してコミットしない。`ui-demo-output/` は `.gitignore` 推奨。
