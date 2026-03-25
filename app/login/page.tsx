"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import "./main.css";

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        {/* ── ロゴ ── */}
        <div className="login-logo-wrap">
          <div className="login-logo-icon">
            <Image src="/login.png" alt="Lumo" width={64} height={64} />
          </div>
          <span className="login-app-name">Lumo</span>
        </div>

        {/* ── タグライン ── */}
        <p className="login-tagline">頭の中に、余白を。</p>

        <div className="login-divider" />

        {/* ── Google ログインボタン ── */}
        <button
          className="login-google-btn"
          onClick={() => signIn("google", { callbackUrl: "/chat" })}
        >
          {/* Google SVG ロゴ */}
          <svg
            className="login-google-btn-icon"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google でログイン
        </button>

        {/* ── フッターノート ── */}
        <p className="login-footer-note">
          ログインすることで、<a href="/terms">利用規約</a>および
          <a href="/privacy">プライバシーポリシー</a>に同意したことになります。
        </p>
      </div>
    </div>
  );
}
