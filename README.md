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

Next.js・React・TailwindCSS・Neon・Vercel などのモダンな技術を用いた、タスク管理アプリです。RESTful API による CRUD 操作、CI/CD、ユニットテスト、自動デプロイなど、フルスタック開発のベストプラクティスを取り入れています。

---

## 🚀 技術スタック

| 分類       | 技術構成                                       |
| -------- | ------------------------------------------ |
| フロントエンド  | Next.js / React / TailwindCSS              |
| バックエンド   | Next.js API Routes（REST API）, Prisma（導入予定） |
| データベース   | Neon（サーバーレス PostgreSQL）                    |
| テスト      | Thunder Client（API テスト） / Vitest（ユニットテスト）  |
| デプロイ     | Vercel（CI/CD 自動デプロイ）                       |
| パッケージ管理  | Yarn                                       |
| 実行環境（予定） | Docker / Docker Compose（開発・本番共通化）          |

---

## ✅ 機能概要

* タスクの作成 / 編集 / 削除
* ステータス切り替え（完了 / 未完了）
* REST API による CRUD（GET / POST / PUT / PATCH / DELETE）
* Neon によるデータ永続化（Prisma 導入予定）
* TailwindCSS によるレスポンシブ対応
* Thunder Client による API テスト
* Vitest によるユニットテストと自動化


## 🧠 アーキテクチャ

```bash
/
├── pages/              # Next.js ページ・APIルート
│   └── api/            # REST API (CRUD)
├── components/         # UI コンポーネント
├── lib/                # DB 接続・共通バリデーション
├── prisma/             # Prisma スキーマ（導入予定）
├── styles/             # Tailwind 設定・グローバルスタイル
├── tests/              # Vitest によるテスト群
└── docker/             # Dockerfile や docker-compose.yml（導入予定）
```

* Next.js API Routes にて CRUD 実装
* Neon と Prisma（予定）による DB 永続化
* バリデーションは共通関数にて管理
* TailwindCSS による高速な UI 構築
* Vercel による CI/CD 自動デプロイ
* Docker による開発・運用環境の統一（予定）


## 🧩 技術的工夫

* **モジュール構成**：機能単位でディレクトリを分割し、保守性と拡張性を向上
* **バリデーション共通化**：データ整合性と再利用性を確保
* **品質管理**：

  * Thunder Client による API の正常・異常ケースのテスト
  * Vitest によるユニットテストでロジックを検証
* **レスポンシブ対応**：全デバイスで快適な操作性を提供
* **CI/CD**：Vercel による自動ビルド・デプロイ
* **Docker（予定）**：開発・本番で一貫した環境の再現性を目指す


## 🛠 セットアップ方法

```bash
git clone https://github.com/あなた/your-todo-app.git
cd your-todo-app

# 環境変数ファイルを作成
cp .env.example .env.local
# .env.local に DATABASE_URL (Neon) を設定

# パッケージインストール
yarn install

# 開発サーバー起動
yarn dev
```


## 🔬 テスト方法

* **API テスト**：Thunder Client による正常系・異常系の確認
* **ユニットテスト**：Vitest によるロジックとバリデーションの自動テスト


## 🎯 開発背景

このアプリは、個人のポートフォリオおよびフルスタック開発練習の一環として構築されました。UI/UX、保守性、バリデーションなどに配慮し、誰が見ても読みやすく・使いやすく・拡張しやすいコードベースを目指しています。

## 🔮 今後の拡張予定

* Prisma の導入とスキーマ定義（Neon 連携）
* ユーザー認証機能（NextAuth.js / Clerk）
* タグ・カテゴリによるタスク分類機能
* タスク期限通知（メールやSNS連携）
* Docker による環境構築（開発・ステージング・本番の統一）

## 🔗 公開URL

👉 [デプロイ済アプリを見る](https://my-todo-9h6e.vercel.app/)

