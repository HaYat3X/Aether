# コンポーネント設計 & CSSルール（Next.js 個人開発向け）

---

## 1. ディレクトリ構成


components/
ui/
features/
layouts/


---

## 2. コンポーネント分類ルール

### 2.1 `ui`（atoms相当）

#### 定義
- 見た目と基本的なUI挙動のみを持つ
- ドメイン知識を持たない

#### 許可
- props（variant, size など）
- children
- 軽いUI状態（hover, open など）

#### 禁止
- API呼び出し
- ビジネスロジック
- 特定ドメイン（User, Post など）

#### 例

Button
Input
Modal
Checkbox


#### 判断基準
> 他のプロジェクトでもそのまま使えるか？

- YES → ui
- NO → features

---

### 2.2 `features`（molecules / organisms）

#### 定義
- アプリ固有の意味を持つUI
- uiコンポーネントを組み合わせたもの

#### 許可
- ドメイン型（User, Post など）
- API呼び出し（hooks含む）
- 状態管理（useState, useQuery など）

#### 例

UserCard
PostList
LoginForm
CommentSection


#### 判断基準
> 「何のためのUIか」を説明できるか？

- YES → features
- NO → ui

---

### 2.3 `layouts`

#### 定義
- ページ全体の構造・配置を担当

#### 許可
- children
- ヘッダー / サイドバーの配置

#### 禁止
- ビジネスロジック
- ドメイン処理

#### 例

MainLayout
DashboardLayout
AuthLayout


---

## 3. 依存ルール（最重要）


ui ← features ← layouts


### ルール
- ui → features の importは禁止
- features → ui はOK
- layouts → features はOK

---

## 4. CSS設計ルール

---

### 4.1 基本方針

> スタイルは「コンポーネント単位で閉じる」

---

### 4.2 ローカルCSS（推奨）

#### 構成

components/
ui/
Button/
index.tsx
styles.module.css


#### 技術
- CSS Modules

#### 特徴
- スコープが閉じる
- 命名衝突なし
- 安全にリファクタ可能

---

### 4.3 グローバルCSS（最小限）

#### ファイル

app/globals.css


#### 許可
- reset / normalize
- フォント
- CSS変数（デザイントークン）
- html, body の基本設定

#### 禁止
- コンポーネント固有のスタイル

---

### 4.4 デザイントークン

#### 定義例
```css
:root {
  --color-primary: #3b82f6;
  --spacing-md: 16px;
}
使用例
.button {
  padding: var(--spacing-md);
}
5. Tailwind使用時のルール（任意）
基本方針
CSSファイルは基本使わない
classNameで完結させる
注意点
classNameが長くなりすぎないようにする
共通UIはコンポーネント化する
6. アンチパターン（禁止事項）
❌ グローバルstylesフォルダ
styles/
  button.css

→ 依存関係が崩壊する

❌ uiコンポーネントの外部上書き
.button {
  color: red;
}

→ 再利用性が壊れる

❌ uiにビジネスロジックを入れる
<Button onClick={handleLogin} />

→ UIの責務逸脱

❌ 迷ったらuiに入れる

→ featuresに入れるのが正解

7. features構成（推奨）
features/
  auth/
    LoginForm/
  post/
    PostList/

→ ドメイン単位で分割する

8. 最終判断フロー
① ドメイン知識を持つか？
  YES → features
  NO ↓

② 他プロジェクトで使えるか？
  YES → ui
  NO → features
9. 設計の原則（重要）
ui = 純粋な部品
features = 意味を持つUI
layouts = 配置のみ
10. 最重要ルール

uiにドメイン知識を絶対に入れない


---