# Task Manager（Next.js / API Routes / Neon）

現場で求められる**保守性・例外系・テスト・自動化**の観点を自走して再現できるよう、UI/UX から自動化までを一連の工程として扱い、**「動く」だけでなく「壊れにくい／変えやすい」コードベース**を目指しています。

チーム開発を想定した構成と品質担保の仕組みづくりを重視しています。

---

## 主な機能

### ユーザー機能

- **ダッシュボード**: タスクの統計（総数、完了、未完了、期限切れ）をリアルタイムで可視化
- **タスク管理**: 作成、編集、削除、期限設定、優先度設定
- **ステータス管理**: ワンクリックでの完了/未完了切り替え
- **リッチな UI**: Framer Motion によるマイクロインタラクション、モーダル編集

### 技術的特徴

- **RESTful API**: PUT（完全置換）と PATCH（部分更新）を区別
- **堅牢なバリデーション**: API入口で入力値を検証し、DB処理前に不正データ拒否
- **統一エラーレスポンス**: `{ error: { code, message, details } }`形式でAPIエラーを返却
- **データ永続化**: Neon PostgreSQL によるデータ管理
- **品質保証**: Vitest によるバリデーションテスト、ESLintによる静的解析
- **開発環境**: Docker / Docker Compose による開発環境構築

---

## 技術スタック

| 分類           | 技術構成                       |
| -------------- | ------------------------------ |
| フロントエンド | Next.js / React / TailwindCSS  |
| バックエンド   | Next.js API Routes（REST API） |
| データベース   | Neon PostgreSQL                |
| テスト         | Vitest                         |
| 静的解析       | ESLint                         |
| DevOps         | Docker / Docker Compose        |
| デプロイ       | Vercel                         |
| パッケージ管理 | Yarn                           |

---

## アーキテクチャ

```bash
/
├── components/              # UIコンポーネント
├── scripts/                 # テストDBセットアップ / クリーンアップ
├── src/
│   ├── __tests__/           # Vitestテスト
│   ├── lib/                 # DB接続 / SQLクエリ
│   ├── pages/               # Next.js Pages Router
│   │   └── api/             # API Routes
│   ├── styles/              # グローバルスタイル
│   └── utils/               # validation / errorHandler
├── Dockerfile
├── docker-compose.yml
└── vite.config.js
```

## 設計の意図（課題 → 解決策 → 成果）

設計の意図（課題解決のアプローチ）
実務でのチーム開発を想定し、保守性、例外系、テスト容易性を重視して設計しました。

1. 責務の分離とモジュール化
   **課題**: API Routes にロジックを書きすぎると、可読性が下がりテストが困難になる。

**解決策**:
Controller (pages/api): リクエストの受け付けとレスポンス返却に専念。

Service/Data Access (src/lib): DB 操作（SQL クエリ）を分離。

Utility (src/utils): バリデーションやエラー処理を共通化。

**成果**: API処理、DB処理、入力検証の責務が分かれ、変更やテストの対象を絞りやすくなった。

2. 厳格なバリデーションと安全性
   **課題**: 不正なデータ（空文字、型違い、\null``、想定外フィールド）が DB に混入し、予期せぬエラーやデータ不整合につながる。

**解決策**:
validation.js にルールを集約し、API の入り口で検証。

`POST` / `PUT` / `PATCH` / `DELETE` ごとに必要な入力を分け、`400 BAD_REQUEST` と `422 VALIDATION_ERROR` を使い分ける。

APIエラーは`{error :{ code, message, details }}`形式に統一し、フロントエンドやテストからに機械的に判定できるようにする。

**成果**: 不正入力をDB処理前に拒否できるようになり、フロントエンド・バックエンド間のAPI契約が明確になった。

`PATCH`で`null`が送られた場合も`422 VALIDATION_ERROR`として扱えるようになり、DB層での想定外エラーを防止できる。

3. RESTful API の適切な実装
   **課題**: 更新処理が曖昧だと、意図しないデータの書き換えや、不完全な更新データによるエラーが発生する。

**解決策**:
PUT: 編集フォーム保存時に使用。全フィールドを送信し、リソースを完全置換。

PATCH: 完了チェック時に使用。変更差分を送信し、部分更新。

PATCH 失敗時はフロントエンド側でレスポンスを確認し、画面状態を元に戻す。

**成果**: 操作の意図に即した更新処理になり、API失敗時に画面だけが成功状態になる問題を防止できる。

4. Docker による環境の標準化
   **課題**: 開発者間での環境差異（OS、Node バージョン）によるトラブルを減らす。

**解決策**: Dockerfile と docker-compose.yml で開発環境をコード管理。

**成果**: 必要に応じてDocker上で開発サーバーを起動でき、環境差異を抑えやすくした。

---

## セットアップ（ローカル実行）

### 前提

- Node.js
- Yarn
- Neon PostgreSQLなどの接続先 DB

### 1) 依存関係のインストール

```bash
yarn install
```

### 2) 環境変数（Neon）

プロジェクトルートに `.env.local` を作成し、`DATABASE_URL` を設定します。

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"
```

### 3) 開発サーバー起動

```bash
yarn dev
```

### 4) Docker で実行

```bash
# 開発サーバー起動（ホットリロード有効）初回 or Dockerfile・依存関係変更時
docker-compose up --build

# 2回目以降
docker-compose up

# 終了時
docker-compose down
```

---

## テスト / 品質管理

```bash
# Lint
yarn lint

# ユニットテスト
yarn test

# カバレッジ取得
yarn test:coverage

# テストDBのセットアップ、カバレッジ、クリーンアップをまとめて実行
yarn test:full
```

---

## API 仕様（概要）

エンドポイント: `/api/todos`

| Method   | 用途         | 主な入力                                                                                       |
| -------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `GET`    | Todo一覧取得 | なし                                                                                           |
| `POST`   | Todo新規作成 | `{ "title": "Task", "date": "2025-01-01", "priority": "high", "completed": false }`            |
| `DELETE` | Todo削除     | `?id=1`                                                                                        |
| `PUT`    | Todo完全置換 | `{ "id": 1, "title": "Edit", "date": "2025-01-01", "priority": "medium", "completed": false }` |
| `PATCH`  | Todo部分更新 | `{ "id": 1, "completed": true }`                                                               |

`PUT` はリソース全体の完全置換、`PATCH` は一部フィールドのみの部分更新として扱います。  
フロントエンドでは、完了状態の切り替えに `PATCH` を使用しています。

### バリデーション方針

Todo APIでは、リクエスト入力をDB処理の前に検証します。

| 対象                           | 方針                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `POST`                         | `title`, `date`, `priority` を必須として検証し、`completed` は未指定時 `false` として扱う |
| `PUT`                          | 完全置換として `id`, `title`, `date`, `priority`, `completed` をすべて必須にする          |
| `PATCH`                        | 部分更新として `id` と1つ以上の更新対象フィールドを必須にする                             |
| `DELETE`                       | query parameter の `id` を正の整数として検証する                                          |
| 想定外フィールド               | `400 BAD_REQUEST` として拒否する                                                          |
| 型違い・空文字・不正値・`null` | `422 VALIDATION_ERROR` として拒否する                                                     |

### エラーレスポンス形式

APIエラーは以下の形式で統一しています。

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "title is required",
    "details": {
      "field": "title"
    }
  }
}
```

### 主なエラーコード

| HTTP Status | code               | 用途                                                 |
| ----------- | ------------------ | ---------------------------------------------------- |
| 400         | `BAD_REQUEST`      | JSON形式不正、Content-Type不備、想定外フィールドなど |
| 404         | `NOT_FOUND`        | 対象Todoが存在しない場合                             |
| 409         | `CONFLICT`         | DB制約違反などの競合                                 |
| 422         | `VALIDATION_ERROR` | 入力値の型・内容が不正な場合                         |
| 500         | `INTERNAL_ERROR`   | 想定外のサーバーエラー                               |

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

[アプリを見る](https://my-todo-9h6e.vercel.app/)