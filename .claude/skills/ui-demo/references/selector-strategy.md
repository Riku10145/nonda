# セレクター戦略

Next.js / React で安定して動くセレクターを選ぶ指針。動的クラス名（Tailwind の `bg-blue-500` や CSS Modules の `_login_abc123`）に依存しないこと。

## 優先順位

1. **`data-testid`** — 最優先。JSX に `data-testid="login-submit"` があれば `page.getByTestId("login-submit")`。
2. **`aria-label` / ロール** — `page.getByRole("button", { name: "ログイン" })`。アクセシビリティを兼ねるので増やしても害がない。
3. **可視テキスト** — `page.getByText("ログイン")`。i18n でテキストが変わる箇所では避ける。
4. **構造的 CSS セレクター** — 最終手段。`form[action="/login"] input[type="email"]` のように、意味のある属性で絞る。
5. **絶対に避ける**: Tailwind クラス、CSS Modules のハッシュ付きクラス、`nth-child` のような位置依存セレクター。

## 変更コンポーネントからセレクターを抽出する手順

1. `git diff origin/main...HEAD -- '*.tsx'` で変更点を見る
2. 操作対象（ボタン・入力欄）の JSX を読む
3. 上記優先順位で使えるものを拾う
4. `data-testid` も `aria-label` も無く、テキストも動的な場合は **ユーザに「`data-testid` を足してもいい？」と聞く**。勝手にコンポーネントを書き換えない

## Playwright 側の書き方

```ts
// testid（最優先）
await page.getByTestId("login-submit").click();

// role + name
await page.getByRole("button", { name: "ログイン" }).click();
await page.getByRole("textbox", { name: "メールアドレス" }).fill("a@b.test");

// label 付き input
await page.getByLabel("パスワード").fill("xxx");

// テキスト（i18n しない箇所だけ）
await page.getByText("利用規約に同意する").click();
```

## HeroUI / shadcn-ui を使っている場合

- HeroUI v3 の `<Button>` などはラップされるが、`aria-label` や `name` prop は子要素に伝播する。`getByRole` が効きやすい。
- ネイティブ `<button>` ではなく `<div role="button">` になっていることがあるので、`getByRole("button", ...)` を優先。
