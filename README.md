# Task Manager（Next.js / API Routes / Neon）

Task Manager です。  
現場で求められる観点（**保守性・例外系・テスト・自動化**）を自走して再現できるよう、チーム開発を想定した構成と品質担保の仕組みづくりを重視しています。

---

## 主な機能

### ユーザー機能

- **ダッシュボード**: タスクの統計（総数、完了、未完了、期限切れ）をリアルタイムで可視化
- **タスク管理**: 作成、編集、削除、期限設定、優先度設定（High/Medium/Low）
- **ステータス管理**: ワンクリックでの完了/未完了切り替え
- **リッチな UI**: Framer Motion によるマイクロインタラクション、モーダル編集

### 技術的特徴

- **RESTful API**: PUT（完全置換）と PATCH（部分更新）を厳密に区別した実装
- **堅牢なバリデーション**: フロントエンド、API、DB の 3 層での入力チェック
- **データ永続化**: Neon (Serverless PostgreSQL) によるデータ管理
- **品質保証**: Vitest によるユニットテスト、GitHub Actions による CI
- **開発環境**: Docker / Docker Compose による環境のコード化

---

## 技術スタック

| 分類           | 技術構成                                                               |
| -------------- | ---------------------------------------------------------------------- |
| フロントエンド | Next.js / React / TailwindCSS                                          |
| バックエンド   | Next.js API Routes（REST API）                                         |
| データベース   | Neon（サーバーレス PostgreSQL）                                        |
| テスト         | Thunder Client（API テスト） / Vitest（ユニットテスト）                |
| DevOps         | GitHub Actions（`.github/workflows`） / Vercel Docker / Docker Compose |
| デプロイ       | Vercel                                                                 |
| パッケージ管理 | Yarn                                                                   |

---

## Lint / Test (CI)
- ESLint uses `eslint.config.mjs`.
- CI runs `yarn lint` and `yarn test:coverage`, and uploads `coverage/` as an artifact.
---

### 🧠 アーキテクチャ

```bash
/
├── .github/
│   └── workflows/      # GitHub Actions ワークフロー定義
├── pages/              # Next.js ページ・API Routes
│   └── api/            # REST API (CRUD)
├── components/         # UI コンポーネント
├── lib/                # DB 接続・共通バリデーション
├── styles/             # Tailwind 設定・グローバルスタイル
├── tests/              # Vitest によるテスト群
├── Dockerfile          # マルチステージビルド定義
└── docker-compose.yml  # ローカル開発環境定義
```

## 設計の意図（課題 → 解決策 → 成果）

設計の意図（課題解決のアプローチ）
実務でのチーム開発を想定し、以下の課題に対して意図的な設計を行いました。

1. 責務の分離とモジュール化
   **課題**: API Routes にロジックを書きすぎると、可読性が下がりテストが困難になる。

**解決策**:
Controller (pages/api): リクエストの受け付けとレスポンス返却に専念。
Service/Data Access (src/lib): DB 操作（SQL クエリ）を分離。
Utility (src/utils): バリデーションやエラー処理を共通化。

**成果**: コードの再利用性が向上し、DB 操作単体でのテストが可能になった。

2. 厳格なバリデーションと安全性
   **課題**: 不正なデータ（空文字や型違い）が DB に混入し、予期せぬエラーが発生する。

**解決策**:
validation.js にルールを集約し、API の入り口で厳密にチェック。
特に completed (boolean) の型チェックや、PUT 時の必須項目チェックを徹底。

**成果**: データの整合性が保たれ、フロントエンド・バックエンド間の契約が明確になった。

3. RESTful API の適切な実装
   **課題**: 更新処理が曖昧だと、意図しないデータの書き換えリスクがある。

**解決策**:
PUT: 編集フォーム保存時に使用。全フィールドを送信し、リソースを完全置換。
PATCH: 完了チェック時に使用。変更差分（completed のみ）を送信し、部分更新。

**成果**: ネットワーク帯域の節約と、操作の意図に即した安全な更新を実現。

4. Docker による環境の標準化
   **課題**: 開発者間での環境差異（OS、Node バージョン）によるトラブル。

**解決策**: Dockerfile と docker-compose.yml で環境をコード管理。

**成果**: docker-compose up 1 コマンドで、DB 接続を含めた開発環境が誰でも再現可能に。

---

## セットアップ（ローカル実行）

### 前提

- Node.js（推奨：LTS）
- Yarn（または npm）
- Neon（PostgreSQL）などの接続先 DB

### 1) 依存関係のインストール

```bash
yarn install
```

### 2) 環境変数（Neon）

プロジェクトルートに `.env.local` を作成し、`DATABASE_URL` を設定してください。

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"
```

### 3) Docker で実行

Docker および Docker Compose がインストールされている必要があります

```bash
# 開発サーバー起動（ホットリロード有効）
docker-compose up --build

# 終了時
docker-compose down
```

### 4) 開発サーバー起動

```bash
yarn dev
```

---

## テスト / 品質管理

- **CI（GitHub Actions）**：CI：GitHub Actions で Push / Pull Request 時にビルド・テストを自動実行
- **API テスト（Thunder Client）**：Thunder Client で正常系・異常系（入力不備、存在しない ID など）を確認
- **ユニットテスト（Vitest）**：ユニットテスト：src/**tests** 配下にテストを配置し、Vitest で検証

```bash
yarn test
```

---

## API 仕様（概要）

> API Routes の性質上、エンドポイントは `pages/api`配下のファイル名で決まります。

- `GET`：一覧取得
- `POST`：新規作成（例：`{ "title": "Task", "date": "2025-01-01", "priority": "high", "completed": false }`）
- `DELETE`：削除（例：`?id=...`）
- `PUT`：完全置換（例：`{ "id": 1, "title": "Edit", "date": "...", "priority": "...", "completed": ... }`）
- `PATCH`：部分更新（例：`{ "id": 1, "completed": true }`）

---

## デプロイ

- Vercel にデプロイ（GitHub 連携）
- `DATABASE_URL` は Vercel 側の環境変数にも設定してください

---

## 今後の拡張予定

- ユーザー認証（NextAuth.js または Clerk）
- タグ・カテゴリによるタスク分類機能
- 通知機能（メール連携）
- Firebase の導入
- 公開LP(SSG)を追加しアプリ画面(/todo)と分離
- Next.js App Router & Server Actions への移行
- データフェッチの高度化 (TanStack Query / SWR)

## 🔗 公開 URL

👉 [アプリを見る](https://my-todo-9h6e.vercel.app/)

