# Task Manager（Next.js / API Routes / Neon）

現場で求められる**保守性・例外系・テスト・自動化**の観点を自走して再現できるよう、UI/UX から自動化までを一連の工程として扱い、**「動く」だけでなく「壊れにくい／変えやすい」コードベース**を目指しています。チーム開発を想定した構成と品質担保の仕組みづくりを重視しています。

---

## 主な機能

### ユーザー機能

- **ユーザー認証**: Clerkを使用したログインとセッション管理
- **ユーザー別データ管理**: ログインユーザーごとにTodoを分離
- **ダッシュボード**: タスクの統計（総数、完了、未完了、期限切れ）をリアルタイムで可視化
- **タスク管理**: 作成、編集、削除、期限設定、優先度設定
- **ステータス管理**: ワンクリックでの完了/未完了切り替え
- **リッチな UI**: Framer Motion によるマイクロインタラクション、モーダル編集

### 技術的特徴

- **認証・データ分離**: ClerkのユーザーIDをDBクエリへ渡し、他ユーザーのTodoを取得・更新しない
- **RESTful API**: PUT（完全置換）と PATCH（部分更新）を区別
- **堅牢なバリデーション**: API入口で入力値を検証し、DB処理前に不正データ拒否
- **統一エラーレスポンス**: `{ error: { code, message, details } }`形式でAPIエラーを返却
- **データ永続化**: Neon PostgreSQL によるデータ管理
- **Migration管理**: `node-pg-migrate`によるスキーマ変更の一元管理
- **テストDB分離**: `DATABASE_URL`と`TEST_DATABASE_URL`を分離し、同一DBへの誤接続を防止
- **TypeScript基盤**: `tsconfig.json`と`typecheck`を導入し、DB・認証・ドメイン境界から段階的に型付け
- **品質保証**: Vitest、DB統合テスト、ESLint、TypeScript、GitHub Actionsによる検証
- **開発環境**: Docker / Docker Compose による開発環境構築

---

## 技術スタック

| 領域           | 技術                                          |
| -------------- | --------------------------------------------- |
| フロントエンド | Next.js / React / TailwindCSS                 |
| バックエンド   | Next.js API Routes（REST API）                |
| 言語           | JavaScript/ TypeScript                        |
| 認証           | Clerk                                         |
| データベース   | Neon PostgreSQL                               |
| Migration      | node-pg-migrate                               |
| テスト         | Vitest /Testing Library/ PostgreSQL統合テスト |
| 静的解析       | ESLint /TypeScript                            |
| DevOps         | Docker / Docker Compose /Github Actions       |
| デプロイ       | Vercel                                        |
| パッケージ管理 | Yarn                                          |

---

## アーキテクチャ

```bash
/
├── .github/
│   └── workflows/                    # CI、セキュリティ、Production migration
├── components/                       # UIコンポーネント
├── docs/
│   └── database-migrations.md        # Production migration手順・復旧手順
├── migrations/                       # PostgreSQL migrationの正本
│   ├── 0001_adopt-or-create-todos.cjs
│   ├── 0002_add-todo-user-id.cjs
│   └── 0003_require-todo-user-id.cjs
├── scripts/
│   ├── db-utils.js                   # DB接続先の検証・安全確認
│   ├── setup-test-db.js              # テストDBのmigration
│   ├── cleanup-test-db.js            # テストデータのクリーンアップ
│   └── verify-production-db.js       # Production schema検証
├── src/
│   ├── __tests__/                    # 単体テスト・DB統合テスト
│   ├── lib/
│   │   ├── auth.ts                   # Clerk認証境界
│   │   ├── db.ts                     # PostgreSQL接続
│   │   └── queries.ts                # Todoクエリ
│   ├── pages/                        # Next.js Pages Router
│   │   └── api/
│   │       ├── health/
│   │       │   └── db.js             # DBヘルスチェックAPI
│   │       └── todos.js              # Todo API
│   ├── styles/                       # グローバルスタイル
│   ├── types/
│   │   └── todo.ts                   # Todoドメイン型
│   ├── utils/                        # validation / errorHandler
│   └── proxy.ts                      # Clerk middleware
├── Dockerfile
├── docker-compose.yml
├── tsconfig.json
├── vite.config.js
└── vite.db.config.js
```

## 設計の意図（課題 → 解決策 → 成果）

設計の意図（課題解決のアプローチ）

1. 責務の分離とモジュール化
   **課題**: API Routes にロジックを書きすぎると、可読性が下がりテストが困難になる。

**解決策**:
Controller (pages/api): リクエストの受け付けとレスポンス返却に専念。
Service/Data Access (src/lib): DB 操作（SQL クエリ）を分離。
Utility (src/utils): バリデーションやエラー処理を共通化。
Authentication(`src/lib/auth.ts`)へ認証境界を分離
Domain Types(`src/types`)へTodoの型定義を集約

**成果**: API処理、DB処理、入力検証の責務が分かれ、変更やテストの対象を絞りやすくなった。

2. 厳格なバリデーションと安全性
   **課題**: 不正なデータ（空文字、型違い、`null`、想定外フィールド）がDBに混入し、予期せぬエラーやデータ不整合につながる。

**解決策**:
バリデーションルールを`validation.js`へ集約
APIの入り口で入力値を検証
`POST` / `PUT` / `PATCH` / `DELETE` ごとに必要な入力を分離
リクエスト形式の不備と入力内容の不備を`400 BAD_REQUEST`と`422 VALIDATION_ERROR`に分類
APIエラーは`{error :{ code, message, details }}`形式に統一

**成果**: 不正入力をDB処理前に拒否でき、フロントエンド・バックエンド間のAPI契約が明確になった。
`PATCH`で`null`が送られた場合も`422 VALIDATION_ERROR`として扱い、DB層での想定外エラーを防止する。

3. RESTful APIの適切な実装
   **課題**: 更新処理が曖昧だと、意図しないデータの書き換えや、不完全な更新データによるエラーが発生する。

**解決策**:
PUT: 編集フォーム保存時に使用。全フィールドを送信し、リソースを完全置換。
PATCH: 完了チェック時に使用。変更差分を送信し、部分更新。
更新可能なフィールドをサーバー側で制限
API失敗時は、フロントエンドの画面状態を元に戻す。

**成果**: 操作の意図に即した更新処理になり、API失敗時に画面だけが成功状態になる問題を防止できる。

4. 認証とユーザー別データの分離
   **課題**: Todoをユーザー単位で制限しない場合、他ユーザーのデータを取得・更新できる可能性がある

**解決策**:
Clerkで認証済みユーザーのIDを取得
`/api/todos`の全メソッドで認証を必須化
Todoテーブルへ`user_id`を追加
`user_id`を必須にするDB制約をmigrationで追加
Todoの取得、作成、更新、削除の全クエリで`user_id`を条件に含める

**成果**: Todoがログインユーザー単位で分離され、他ユーザーのTodoを操作できない構成になった。

5. TypeScriptの段階的導入

**課題**: JavaScriptだけでは、DBレコードやドメインデータの型の不整合を実行時まで検出できない。

**解決策**:

- `tsconfig.json`を追加
- `yarn typecheck`を追加
- CIで型チェックを実行
- `src/types/todo.ts`へTodo型を定義
- DB接続、クエリ、認証境界をTypeScript化
- `allowJs`を使用し、既存のJavaScriptを維持しながら段階的に移行

**成果**: アプリ全体を一度に変更せず、重要な境界から型安全性を高められる構成になった。

---

## セットアップ（ローカル実行）

### 前提

- Node.js
- Yarn
- Neon PostgreSQLなどの接続先 DB
- Clerk

### 1) 依存関係のインストール

```bash
yarn install
```

### 2) 環境変数

プロジェクトルートに `.env.local` を作成し、`.env.example` を参考に設定します。

```env
# アプリ実行時のDB接続URL
DATABASE_URL="postgresql://USER:PASSWORD@NEON_POOLER_HOST/DBNAME?sslmode=verify-full"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_example"
CLERK_SECRET_KEY="sk_test_example"
```

#### テスト用環境変数

DB統合テストを実行する場合は、プロジェクトルートに`.env.test`を作成します。

`.env.test.example`を参考に、Productionとは異なるテスト専用DBを設定してください。

```env
# ローカルPostgreSQLを使用する場合
TEST_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/my_todo_test?sslmode=disable"

# Neonのテスト専用DBを使用する場合
# TEST_DATABASE_URL="postgresql://USER:PASSWORD@NEON_TEST_HOST/DBNAME?sslmode=verify-full"
```

`TEST_DATABASE_URL`には、Production DBや`DATABASE_URL`と同じ接続先を設定しないでください。

テスト用スクリプトは接続先を検証し、安全ではない接続先を検出した場合は処理を中止します。

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

## Database / Migration

### Migrationの方針

- `migrations/`をPostgreSQL schemaの正本とする
- Productionとtestで同じmigrationファイルを使用する
- 適用履歴を`public.schema_migrations`で管理する
- Production migrationは、レビュー済みの`main`から実行する
- Production migrationは、GitHub Environmentの承認後に適用する
- Production DBへテスト用のセットアップ・クリーンアップ処理を実行しない
- 既存migrationを後から書き換えず、新しいmigrationを追加する

Productionへの適用、確認、失敗時の復旧手順は、次の文書を参照してください。

[Database migration runbook](./docs/database-migrations.md)

### Migrationファイルの作成

```bash
yarn db:migration:create <migration-name>
```

作成したmigrationは、テスト専用DBで検証してからレビューしてください。

### テストDBへの適用

```bash
yarn db:migrate:test
```

テストDBの接続先は`.env.test`の`TEST_DATABASE_URL`から取得します。

### Production schemaの確認

```bash
yarn db:verify:production
```

Productionへの適用コマンドは、原則としてGitHub Actionsの`Migrate production database` workflowから実行します。

---

## テスト / 品質管理

```bash
# Lint
yarn lint
# TypeScript
yarn typecheck

# ユニットテスト
yarn test

# カバレッジ取得
yarn test:coverage

#DB統合テスト

yarn test:db

# 単体テストとDB統合テストの一括実行
yarn test:full
```

GitHub Actionsでは、主に次の項目を確認します。

- TypeScript型チェック
- DB migration・統合テスト
- ESLint
- Production build
- 依存関係のセキュリティ監査
- テストカバレッジ
- CodeQLなどのセキュリティチェック

---

## API 仕様

エンドポイント: `/api/todos`

すべてのメソッドでClerkによる認証が必要です。
認証済みユーザーの`user_id`をDBクエリの条件に含めるため、取得・更新・削除できるのはログインユーザー自身のTodoだけです。

| Method   | 用途         | 主な入力                                                                                       |
| -------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `GET`    | Todo一覧取得 | なし                                                                                           |
| `POST`   | Todo新規作成 | `{ "title": "Task", "date": "2025-01-01", "priority": "high", "completed": false }`            |
| `DELETE` | Todo削除     | `?id=1`                                                                                        |
| `PUT`    | Todo完全置換 | `{ "id": 1, "title": "Edit", "date": "2025-01-01", "priority": "medium", "completed": false }` |
| `PATCH`  | Todo部分更新 | `{ "id": 1, "completed": true }`                                                               |

`POST` / `PUT` / `PATCH` では、`Content-Type: application/json` を指定してください。

| Method   | HTTP Status | 主なレスポンス                                    |
| -------- | ----------- | ------------------------------------------------- |
| `GET`    | 200         | ログインユーザーのTodoの配列                      |
| `POST`   | 201         | 作成されたTodo                                    |
| `DELETE` | 200         | `{ "message": "Todo deleted successfully" }`      |
| `PUT`    | 200         | `{ "message", "method": "PUT", "todo": { ... } }` |
| `PATCH`  | 200         | 更新されたTodo                                    |

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

`PUT` はリソース全体の完全置換、`PATCH` は一部フィールドのみの部分更新として扱います。  
 フロントエンドでは、完了状態の切り替えに `PATCH` を使用しています。

`POST` / `PUT` / `PATCH`で、リクエスト本文が空、JSON形式が不正、または`Content-Type`が不正な場合は、`400 BAD_REQUEST`を返します。

### DB接続確認 API

エンドポイント: `GET /api/health/db`

Neon PostgreSQLへの接続状態を確認するためのヘルスチェックAPIです。  
DBに対して`SELECT 1 AS health`のみを実行し、Todoデータの作成・取得・更新・削除は行いません。

#### 正常時

- HTTP Status: `200 OK`
- `Allow: GET`
- `Cache-Control: no-store`

```json
{
  "status": "ok",
  "checks": {
    "database": "ok"
  }
}
```

### DB接続失敗時

DBが利用できない場合は、内部の接続情報、SQL、スタックトレースをレスポンスに含めず、`503`
`SERVICE_UNAVAILABLE`を返します。

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Database unavailable"
  }
}
```

### GET以外のメソッド

`GET`以外のメソッドには、`405 METHOD_NOT_ALLOWED`を返します。

```json
{
  "error": {
    "code": "METHOD_NOT_ALLOWED",
    "message": "Method POST Not Allowed"
  }
}
```

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

`details`はエラーに補足情報がある場合のみ含まれます。

### 主なエラーコード

| HTTP Status | code | 用途 |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | JSON形式不正、Content-Type不備、想定外フィールド |
| 401 | `UNAUTHORIZED` | Clerkの認証情報がない場合 |
| 404 | `NOT_FOUND` | 対象Todoが存在しない、またはログインユーザーが所有していない場合 |
| 405 | `METHOD_NOT_ALLOWED` | 許可されていないHTTPメソッド |
| 409 | `CONFLICT` | PostgreSQLの一意制約違反（`23505`） |
| 422 | `VALIDATION_ERROR` | 入力値の型・内容が不正な場合 |
| 500 | `INTERNAL_ERROR` | 想定外のサーバーエラー |
| 503 | `SERVICE_UNAVAILABLE` | DBへ接続できない場合 |

---

## デプロイ

- Vercel にデプロイ（GitHub 連携）
- `DATABASE_URL` は Vercel 側の環境変数にも設定してください
- Vercel側に`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`を設定
- Vercel側に`CLERK_SECRET_KEY`を設定
- Production migrationは、GitHub Actionsの承認付きworkflowから実行
- デプロイ後に`GET /api/health/db`でDB接続を確認
- 接続URLや秘密鍵をリポジトリ、Issue、PR、ログへ記載しない

---

## 今後の拡張予定
- API防御
- API契約テスト
- App Router移行

## 🔗 公開 URL

[アプリを見る](https://my-todo-9h6e.vercel.app/)