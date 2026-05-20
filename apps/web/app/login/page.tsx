"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <main>
      <div>
        <h1>nonda にログイン</h1>
        <p>薬の飲み忘れを防ぐ服用記録アプリ</p>
        <Suspense fallback={<LoginButton callbackUrl="/" />}>
          <LoginButtonWithCallback />
        </Suspense>
      </div>
    </main>
  );
}

function LoginButtonWithCallback() {
  const callbackUrl = useSearchParams().get("callbackUrl") ?? "/";
  return <LoginButton callbackUrl={callbackUrl} />;
}

function LoginButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <button type="button" onClick={() => signIn("google", { redirectTo: callbackUrl })}>
      <GoogleIcon />
      Google でログイン
    </button>
  );
}

// TODO(#40): アイコン用途が増えたら @iconify/react 導入を検討して `logos:google-icon` 等に置き換える
function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.997 10.997 0 0 0 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18a11.002 11.002 0 0 0 0 9.9l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
        fill="#EA4335"
      />
    </svg>
  );
}
