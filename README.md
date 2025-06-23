This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

# 📋 Todo アプリ

Next.js・React・TailwindCSS・Neon・Vercel などのモダン技術を用いたタスク管理アプリです。RESTful API による CRUD 操作、CI/CD（GitHub Actions / Vercel）、ユニットテスト、自動デプロイなど、フルスタック開発のベストプラクティスを取り入れています。
---

## 🚀 技術スタック

| 分類      | 技術構成                                         |
| ------- | -------------------------------------------- |
| フロントエンド | Next.js / React / TailwindCSS                |
| バックエンド  | Next.js API Routes（REST API），Prisma（導入予定）    |
| データベース  | Neon（サーバーレス PostgreSQL）                      |
| テスト     | Thunder Client（API テスト） / Vitest（ユニットテスト）    |
| CI/CD   | GitHub Actions（`.github/workflows`） / Vercel |
| コンテナ    | Docker（導入予定）                                 |
| デプロイ    | Vercel（自動デプロイ）                               |
| パッケージ管理 | Yarn                                         |
---

## ✅ 機能概要

* タスクの作成・編集・削除
* 完了／未完了ステータス切替
* REST API による CRUD（GET / POST / PUT / PATCH / DELETE）
* Neon によるデータ永続化（Prisma 導入予定）
* TailwindCSS によるレスポンシブ対応
* Thunder Client による API テスト
* Vitest によるユニットテストと自動化
* GitHub Actions ワークフローによる CI（ビルド・テスト）
---
## 🧠 アーキテクチャ

```bash
/
├── .github/
│   └── workflows/      # GitHub Actions ワークフロー定義
├── pages/              # Next.js ページ・API Routes
│   └── api/            # REST API (CRUD)
├── components/         # UI コンポーネント
├── lib/                # DB 接続・共通バリデーション
├── prisma/             # Prisma スキーマ（導入予定）
├── styles/             # Tailwind 設定・グローバルスタイル
└── tests/              # Vitest によるテスト群
```

* Next.js API Routes で CRUD 実装
* Neon と Prisma（予定）で DB 永続化
* 共通バリデーション関数でデータ整合性を確保
* TailwindCSS による高速な UI 構築
* GitHub Actions & Vercel で CI/CD 自動化
---

## 🧩 技術的工夫

* **モジュール構成**：機能単位でディレクトリを整理し、保守性・拡張性を向上
* **バリデーション共通化**：再利用性とデータ整合性を確保
* **品質管理**：
  * Thunder Client による API の正常・異常ケーステスト
  * Vitest によるユニットテストでロジックを検証
* **レスポンシブ対応**：全デバイスで快適な UI/UX
* **CI/CD**：GitHub Actions でビルド・テストを自動実行 → Vercel へデプロイ
---

## 🛠 セットアップ方法

```bash
git clone https://github.com/あなた/your-todo-app.git
cd your-todo-app

# 環境変数
cp .env.test .env.local
# .env.local に DATABASE_URL (Neon) を設定

# 依存関係インストール
yarn install

# 開発サーバー起動
yarn dev
```
## 🔬 テスト方法

* **CI (GitHub Actions)**：Push／Pull Request 時にビルド＆テストを自動実行
* **API テスト**：Thunder Client で正常系・異常系を確認
* **ユニットテスト**：Vitest でバリデーション・ロジックを検証
---

## 🎯 開発背景

個人のポートフォリオおよびフルスタック開発の学習用プロジェクトとして構築。
UI/UX、保守性、テスト、自動化の全工程を通じてバリデーションなどに配慮の良いコードベースを目指しています。
---
## 🔮 今後の拡張予定

* Prisma の導入とスキーマ定義
* Docker コンテナ化による一貫した開発環境
* ユーザー認証（NextAuth.js または Clerk）
* タグ・カテゴリによるタスク分類機能
* 通知機能（期限アラート／メール連携）

## 🔗 公開URL
👉 [アプリを見る](https://my-todo-9h6e.vercel.app/)