# Task Manager（Next.js / API Routes / Neon）

Task Managerです。  
実務未経験でも現場で求められる観点（**保守性・例外系・テスト・自動化**）を自走して再現できるよう、チーム開発を想定した構成と品質担保の仕組みづくりを重視しています。

---

## 主な機能
- タスクの作成・編集・削除
- 完了／未完了ステータス切替
- REST API による CRUD（GET / POST / PUT / PATCH / DELETE）
- Neon によるデータ永続化（Prisma 導入予定）
- TailwindCSS によるレスポンシブ対応
- Thunder Client による API テスト（正常系・異常系）
- Vitest によるユニットテスト
- GitHub Actions による CI（ビルド・テスト）

---

## 技術スタック
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

### 🧠 アーキテクチャ

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
## ディレクトリ構成
- `src/pages`：画面（Pages Router）
- `src/pages/api`：API Routes（CRUD）
- `src/lib`：DB操作（queries）
- `src/utils`：validation / errorHandler
- `src/__tests__`：Vitest テスト

---

## 設計の意図（課題 → 打ち手 → 成果）

### 1) モジュール構成（責務分離）

**課題**
API Routes 内に処理が集中すると、責務混在・重複実装・修正漏れが起きやすく、影響範囲が追いづらくなる。

**打ち手（方法／採用理由）**
- APIハンドラーは HTTP 入出力（`req/res`）とメソッド分岐に寄せて薄く保つ
- DB操作を `src/lib/queries.js` に集約（例：`getTodos / addTodo / deleteTodo / updateTodo`）
- 入力検証を `src/utils/validation.js` に集約（例：`validateTodoInput / validateCompleteTodoInput / validateId`）
- 例外処理を `src/utils/errorHandler.js` に集約（例：`handleError`）

**成果**
- 可読性：処理の流れ（入力→検証→DB→返却）が追いやすい
- 再利用性：共通処理を他エンドポイントにも流用しやすい
- テスト容易性：関数単位で検証しやすい構造になった

---

### 2) バリデーション共通化（整合性・安全性）

**課題**
入力チェックが弱いと不正データがDBに混入し、後続処理で例外や不整合を招きやすい。

**打ち手**

**課題**  
入力チェックが弱いと不正データがDBに混入し、後続処理で例外や不整合を招きやすい。フロントとAPIでルールが分散すると、仕様変更時に更新漏れが起きて整合性が崩れやすい。

**打ち手（方法／採用理由）**
- APIの入口で必ず検証し、サーバ側を最終防衛線として位置付け
- POST/PUT/DELETE などメソッドごとに必要な検証を適用（例：作成時の必須入力、PUTの完全置換、削除時のID形式など）
- ルールは `validation.js` に集約し、修正箇所を一箇所に寄せる

**成果**
- データ整合性：不正データを入口でブロックできる
- 予防保守：異常入力起因の例外・手戻りを減らしやすい
- テスト観点：異常系パターンが明確になり、確認が再現しやすい

---

### 3) エラーハンドリング統一（APIの契約を揃える）

**課題**  
エラー形式やステータスがバラバラだとクライアント側の分岐が増え、保守性が下がる。内部エラー情報の露出もリスクになる。

**打ち手（方法／採用理由）**
- `handleError(res, error, message)` を共通化し、エラー時の返却方針を統一
- クライアントへは必要最小限の情報を返し、詳細はログ側で追える形を意識

**成果**
- 一貫性：クライアント側の実装が単純化（分岐が増えにくい）
- 保守性：原因追跡がしやすい
- セキュリティ：内部情報の過剰な露出を避けやすい
---

### 4) DB接続の共通化（環境差の吸収）
**課題**  
ローカル／本番で接続情報が異なるため、設定が散らばると管理が難しく、環境差で動作がぶれる原因になる。

**打ち手（方法／採用理由）**
- 接続情報は環境変数で管理し、DBアクセスは `lib` 側に集約
- APIは接続の詳細を持たず、共通処理を呼び出すだけにして変更点を一箇所に集約

**成果**
- 管理性：環境切替が明確になり運用しやすい
- 影響範囲：接続方式変更時の修正範囲を最小化できる
---

## セットアップ（ローカル実行）

### 前提
- Node.js（推奨：LTS）
- Yarn（または npm）
- Neon（PostgreSQL）などの接続先DB

### 1) 依存関係のインストール
```bash
yarn install
```
### 2) 環境変数（Neon）

プロジェクトルートに `.env.local` を作成し、`DATABASE_URL` を設定してください。

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"
```

### 3) 開発サーバー起動

```bash
yarn dev
```

---

## テスト / 品質管理

* **CI（GitHub Actions）**：CI：GitHub Actions で Push / Pull Request 時にビルド・テストを自動実行
* **APIテスト（Thunder Client）**：Thunder Client で正常系・異常系（入力不備、存在しないIDなど）を確認
* **ユニットテスト（Vitest）**：ユニットテスト：src/__tests__ 配下にテストを配置し、Vitest で検証

テスト実行（例）
実行コマンドは package.json の scripts に従ってください。
```bash
yarn test
```

---

## API仕様（概要）

> API Routes の性質上、エンドポイントは `pages/api`（または `src/pages/api`）配下のファイル名で決まります。
* `GET`：一覧取得
* `POST`：作成（例：`{ title, date, priority }`）
* `DELETE`：削除（例：`?id=...`）
* `PUT`：完全置換（例：`{ id, title, date, priority }`）
* `PATCH`：部分更新（例：`{ id, title?, date?, priority? }`）

---

## デプロイ

* Vercel にデプロイ（GitHub連携）
* `DATABASE_URL` は Vercel 側の環境変数にも設定してください
---

## 今後の拡張予定

* Prisma の導入とスキーマ定義
* Docker コンテナ化による一貫した開発環境の構築
* ユーザー認証（NextAuth.js または Clerk）
* タグ・カテゴリによるタスク分類機能
* 通知機能（期限アラート／メール連携）
* Firebase の導入

## 🔗 公開URL
👉 [アプリを見る](https://my-todo-9h6e.vercel.app/)