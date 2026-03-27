"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import "./main.css";

/* ──────────────────────────────────────────
   Features data
   ────────────────────────────────────────── */
const FEATURES = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
        <path d="M8 12h4m0 0l-2-2m2 2l-2 2" />
        <circle cx="16" cy="12" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    title: "AIチャット",
    desc: "自然な言葉で話しかけるだけ。予定の登録もタスクの追加も、チャット一つで完結。",
    tag: "Chat",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
    title: "スケジュール管理",
    desc: "Googleカレンダーと連携。週間・日別で予定を一覧表示し、今日何をすべきかを一目で。",
    tag: "Schedule",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    title: "タスク管理",
    desc: "Notionと連携したカンバンボード。優先度・カテゴリで整理し、今週やることを明確に。",
    tag: "Tasks",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "デイリープラン",
    desc: "今日の作業をタイムライン形式で可視化。進行中のタスクがひと目でわかるリアルタイム表示。",
    tag: "Daily",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: "スクラップ",
    desc: "ふと浮かんだアイデアをその場でキャプチャ。タグ分類で後から探しやすく、思考を逃さない。",
    tag: "Scraps",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    title: "LINE連携",
    desc: "外出先でもLINEから同じAI秘書を呼び出せる。移動中でも、手ぶらのままアシスタントが動く。",
    tag: "LINE",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Googleアカウントでログイン",
    desc: "アカウント登録は不要。Googleアカウントで即スタート。",
  },
  {
    num: "02",
    title: "AIに話しかける",
    desc: "「今日の予定は？」「このタスク登録して」— 普通の言葉で指示するだけ。",
  },
  {
    num: "03",
    title: "余白が生まれる",
    desc: "頭の中の仕事をLumoに預けて、大切なことに集中できる。",
  },
];

/* ──────────────────────────────────────────
   Intersection Observer hook (scroll reveal)
   ────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".lp-reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ──────────────────────────────────────────
   Page Component
   ────────────────────────────────────────── */
export default function LandingPage() {
  useScrollReveal();

  return (
    <div className="lp-root" data-theme="light">
      {/* ════════ NAV ════════ */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-nav-logo">
            <div className="lp-nav-logo-icon">
              <Image src="/login.png" alt="Lumo" width={28} height={28} />
            </div>
            <span>Lumo</span>
          </Link>
          <Link href="/login" className="lp-nav-cta">
            はじめる
          </Link>
        </div>
      </nav>

      {/* ════════ HERO ════════ */}
      <section className="lp-hero">
        {/* background orbs */}
        <div className="lp-hero-orb lp-hero-orb-1" />
        <div className="lp-hero-orb lp-hero-orb-2" />
        <div className="lp-hero-grain" />

        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            AI Personal Assistant
          </div>

          <h1 className="lp-hero-title">
            頭の中に、
            <br />
            <em>余白</em>を。
          </h1>

          <p className="lp-hero-sub">
            忙しい毎日の中で、次に何をすべきか迷っていませんか？
            <br />
            Lumoはあなたの思考の負担を引き受け、
            <br className="lp-hero-br" />
            大切なことへ集中できる空間をつくります。
          </p>

          <div className="lp-hero-actions">
            <Link href="/login" className="lp-btn-primary">
              無料ではじめる
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <a href="#features" className="lp-btn-ghost">
              機能を見る
            </a>
          </div>

          {/* Floating UI preview */}
          <div className="lp-hero-preview">
            <div className="lp-preview-card">
              <div className="lp-preview-header">
                <div className="lp-preview-avatar">
                  <Image src="/login.png" alt="" width={22} height={22} />
                </div>
                <div className="lp-preview-name">Lumo</div>
                <div className="lp-preview-dot" />
              </div>
              <div className="lp-preview-bubble lp-preview-bubble-ai">
                おはようございます！今日は<strong>3件の予定</strong>と<br />
                <strong>5件のタスク</strong>があります。まず何から始めますか？
              </div>
              <div className="lp-preview-bubble lp-preview-bubble-user">
                今日の進行中タスクを見せて
              </div>
              <div className="lp-preview-chips">
                <span className="lp-preview-chip">予定を追加</span>
                <span className="lp-preview-chip">タスク登録</span>
                <span className="lp-preview-chip">今日の要約</span>
              </div>
            </div>

            {/* floating mini cards */}
            <div className="lp-float-card lp-float-card-a">
              <div className="lp-float-dot lp-float-dot-green" />
              <span>APIリファクタリング</span>
              <span className="lp-float-badge">進行中</span>
            </div>
            <div className="lp-float-card lp-float-card-b">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect
                  x="2"
                  y="3"
                  width="12"
                  height="10"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M2 7h12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <span>14:00 デザインレビュー</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section className="lp-features" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-label lp-reveal">Features</div>
          <h2 className="lp-section-title lp-reveal">
            散らかった仕事を、
            <br />
            静かに整える。
          </h2>
          <p className="lp-section-desc lp-reveal">
            スケジュール・タスク・メモ・デイリープラン。
            <br />
            仕事に必要なすべてを、AIが一元管理します。
          </p>

          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={f.tag}
                className="lp-feature-card lp-reveal"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="lp-feature-icon">{f.icon}</div>
                <div className="lp-feature-tag">{f.tag}</div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section className="lp-steps">
        <div className="lp-section-inner">
          <div className="lp-section-label lp-reveal">How it works</div>
          <h2 className="lp-section-title lp-reveal">
            次にやることを、
            <br />
            やさしく照らす。
          </h2>

          <div className="lp-steps-list">
            {STEPS.map((s, i) => (
              <div
                key={s.num}
                className="lp-step lp-reveal"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-body">
                  <h3 className="lp-step-title">{s.title}</h3>
                  <p className="lp-step-desc">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && <div className="lp-step-line" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ QUOTE / PHILOSOPHY ════════ */}
      <section className="lp-philosophy">
        <div className="lp-philosophy-inner lp-reveal">
          <blockquote className="lp-philosophy-quote">
            「考える負担を減らして、
            <br />
            <em>進むことに集中できる</em>」
          </blockquote>
          <p className="lp-philosophy-body">
            優秀なアシスタントは、聞かれる前に動く。
            <br />
            Lumoはあなたの仕事のリズムを学び、
            <br />
            毎日少しずつ、暮らしをなめらかにしていきます。
          </p>
        </div>
      </section>

      {/* ════════ CTA ════════ */}
      <section className="lp-cta">
        <div className="lp-cta-inner lp-reveal">
          <div className="lp-cta-icon">
            <Image src="/login.png" alt="Lumo" width={48} height={48} />
          </div>
          <h2 className="lp-cta-title">今日から、余白を取り戻す。</h2>
          <p className="lp-cta-sub">
            Googleアカウントで即座にスタート。
            <br />
            複雑な設定は不要です。
          </p>
          <Link href="/login" className="lp-btn-primary lp-btn-large">
            Lumoをはじめる — 無料
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">
            <div className="lp-nav-logo-icon">
              <Image src="/login.png" alt="Lumo" width={22} height={22} />
            </div>
            <span>Lumo</span>
          </div>
          <p className="lp-footer-copy">© 2026 Lumo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
