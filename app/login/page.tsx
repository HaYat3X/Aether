import { signIn } from "next-auth/react";
import Image from "next/image";
import "./main.css";
import LoginButton from "./LoginButton";
import "../globals.css";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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

        <LoginButton />

        {error === "unauthorized" && (
          <p className="login-error">このアカウントはご利用いただけません。</p>
        )}

        {/* ── フッターノート ── */}
        <p className="login-footer-note">
          ログインすることで、<a href="/terms">利用規約</a>および
          <a href="/privacy">プライバシーポリシー</a>に同意したことになります。
        </p>
      </div>
    </div>
  );
}
