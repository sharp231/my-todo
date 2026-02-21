# Task Manager（Next.js / API Routes / Neon）

Task Manager です。  
現場で求められる**保守性・例外系・テスト・自動化**の観点を自走して再現できるよう、UI/UX から自動化までを一連の工程として扱い、**「動く」だけでなく「壊れにくい／変えやすい」コードベース**を目指しています。チーム開発を想定した構成と品質担保の仕組みづくりを重視しています。
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

# Docker コンテナ内で実行 docker compose up --build# → コンテナ内で node:20-alpine を使用# → コンテナ内で yarn dev を実行# → ボリュームマウントでホットリロード対応

メリット: 環境が統一される、本番に近い環境、チーム間で再現しやすい
デメリット: 起動がやや遅い、メモリ使用量が増える
実際の動作
どちらも最終的には next dev を実行しますが、実行環境が異なります：
yarn dev: Windows → ホストの Node.js → next dev
docker compose up: Windows → Docker コンテナ（Linux） → コンテナ内の Node.js → next dev


1. 通常の開発・動作確認 → yarn dev
   yarn dev
   起動が速い（数秒）
   デバッグしやすい
   メモリ使用量が少ない
   ホットリロードも動作
2. Docker を使う場面
   docker compose up --build
   本番環境に近い環境で確認したい時
   チームで環境を統一したい時
   CI/CD で Docker を使う場合の事前確認
   Node.js バージョンや OS 差を避けたい時
   使い分けの目安
   作業内容 推奨方法 理由
   コード編集・動作確認 yarn dev 速い、シンプル
   API 動作確認 yarn dev 十分
   本番デプロイ前の最終確認 docker compose up 本番に近い環境
   チーム開発 チーム方針に合わせる 統一性
   現在の状況
   Docker 設定は完了（必要時に使える）
   通常開発は yarn dev で問題なし
   外部 DB（Neon）を使用しているため、どちらでも同じ DB に接続

## 今後の拡張予定 (Roadmap)

現在 GitHub Issues で管理しているタスクに加え、技術トレンドへの適応と DX（開発者体験）向上を目指した以下の改修を計画しています。

### 🛠 アーキテクチャ刷新・モダン化 (Technical Improvements)
**1. TypeScript への移行（最優先）**
- **課題**: 現在の JavaScript では実行時まで型エラーに気づけないため、保守コストが高い。
- **計画**: `.js` を `.ts/tsx` に移行し、`interface Todo` 等の型定義をフロント・バックエンド間で共有することで、コンパイル時にバグを排除する堅牢な設計にする。

**2. Next.js App Router & Server Actions への移行**
- **課題**: Pages Router (`src/pages`) と API Routes の構成では、通信オーバーヘッドが発生しやすい。
- **計画**: 最新の `src/app` ディレクトリ構成へ移行。`use server` (Server Actions) を導入し、DB 操作を関数として直接呼び出すことで、API エンドポイント管理の手間を削減する。

**3. データフェッチの高度化 (TanStack Query / SWR)**
- **課題**: `useEffect` + `fetch` ではキャッシュ管理やローディング状態の制御が冗長になりがち。
- **計画**: TanStack Query を導入し、自動再検証 (Revalidation) や 楽観的更新 (Optimistic UI) を実装して UX を向上させる。

### ✨ 機能追加 (Feature Extensions)
- [ ] **タグ / カテゴリ機能** (#19)
    - タスクの分類・フィルタリング機能の実装
- [ ] **ユーザー認証**
    - NextAuth.js または Clerk を用いたセキュアなログイン基盤
- [ ] **リアルタイム性 / モバイル操作性の向上** (#20)
    - Firebase 等を活用した複数デバイス間の即時同期

### 🧪 品質保証 (Quality Assurance)
- [ ] **UI コンポーネントテストの拡充** (#17)
    - `@testing-library/react` を用いた、ユーザー操作に近い形での DOM テスト
- [ ] **テストカバレッジの可視化** (#18) クリア
    - CI 上でレポートを生成し、README にバッジを表示して品質を定量化する
