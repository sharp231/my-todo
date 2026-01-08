```md
# TODOアプリ（フルスタック学習 / Next.js + Neon）

個人ポートフォリオおよびフルスタック開発の学習用プロジェクトとして構築しています。  
実務未経験であっても現場で求められる観点（**保守性・例外系・テスト・自動化**）を自走して再現できるよう、チーム開発を想定したコードの読みやすさと、品質を担保する仕組みづくりを重視しました。

---

## 目次
- [機能概要](#機能概要)
- [技術スタック](#技術スタック)
- [アーキテクチャ](#アーキテクチャ)
- [設計方針](#設計方針)
- [API仕様](#api仕様)
- [バリデーション](#バリデーション)
- [エラーハンドリング](#エラーハンドリング)
- [テスト](#テスト)
- [CI/CD](#cicd)
- [ローカル起動手順](#ローカル起動手順)
- [今後の拡張予定](#今後の拡張予定)

---

## 機能概要
- タスクの作成・編集・削除
- 完了／未完了ステータス切替
- REST API による CRUD（GET / POST / PUT / PATCH / DELETE）
- Neon によるデータ永続化（Prisma 導入予定）
- TailwindCSS によるレスポンシブ対応
- Thunder Client による API テスト（正常系・異常系）
- Vitest によるユニットテストと自動化
- GitHub Actions による CI（ビルド・テスト）

---

## 技術スタック
- Next.js（Pages Router / API Routes）
- JavaScript（Node.js 実行環境）
- TailwindCSS
- Neon（PostgreSQL）
- Vitest（Unit Test）
- GitHub Actions（CI）
- Vercel（デプロイ）

---

## アーキテクチャ
```

/
├── .github/
│   └── workflows/      # GitHub Actions ワークフロー定義
├── pages/              # Next.js ページ・API Routes
│   └── api/            # REST API (CRUD)
├── components/         # UI コンポーネント
├── lib/                # DB接続・クエリ（DB操作）
├── prisma/             # Prisma スキーマ（導入予定）
├── styles/             # Tailwind 設定・グローバルスタイル
└── tests/              # Vitest によるテスト群

````

---

## 設計方針
APIの責務を明確にし、処理を「入力→検証→DB→返却」の流れに統一しています。

### 技術的工夫（課題 → 打ち手 → 成果）

#### 1) モジュール構成（責務分離）
**課題**  
API Routes 内に処理が集中すると、ファイル肥大化・責務混在が起きやすく、修正時の影響範囲が読みづらい。DB接続・入力チェック・エラー処理が散らばると重複実装が増え、仕様変更時に修正漏れが起きやすい。

**打ち手**  
- DB操作を `lib/queries` に集約（例：`getTodos / addTodo / deleteTodo / updateTodo`）
- 入力検証を `utils/validation` に集約（例：`validateTodoInput / validateCompleteTodoInput / validateId`）
- 例外処理を `utils/errorHandler`（`handleError`）に集約

**成果**  
- 可読性：メソッドごとの処理フローが追いやすい  
- 再利用性：共通処理を他エンドポイントでも流用しやすい  
- テスト容易性：関数単位で検証しやすい構造になった  

#### 2) バリデーション共通化（整合性・安全性）
**課題**  
不正データの混入や、フロント／APIで検証ルールが分散することによる不整合が起きやすい。

**打ち手**  
- API入口で必ず検証を通し、サーバ側を最終防衛線として位置付け  
- `validation` を共通化し、メソッドごとに必要な検証を適用  

**成果**  
- データ整合性：不正データを入口でブロック  
- 予防保守：異常入力起因の手戻りを減らしやすい  
- テスト観点：異常系のパターンを固定化しやすい  

#### 3) エラーハンドリング統一（APIの契約を揃える）
**課題**  
エラー形式やステータスコードがバラバラだとクライアント側の分岐が増え、保守性が下がる。内部エラー情報の露出もリスク。

**打ち手**  
- `handleError(res, error, message)` を共通化し、エラー時の返却方針を統一  
- 詳細はログ側、クライアントには必要最小限の情報のみ返却

**成果**  
- 一貫性：クライアント側の分岐が増えにくい  
- 保守性：原因追跡がしやすい  
- セキュリティ：内部情報の露出を抑えやすい  

#### 4) Neon接続の共通化（環境差の吸収）
**課題**  
ローカル／本番で接続情報が変わるため、設定が散らばると管理が難しく、環境差で動作がぶれる。

**打ち手**  
- DB接続情報を環境変数で管理し、DBアクセスは `lib` 側に集約  
- APIは接続詳細を持たず、共通処理を呼び出すだけにする

**成果**  
- 管理性：環境切替が明確  
- 影響範囲：接続方式変更時の修正範囲を最小化  

---

## API仕様
> ルートは `pages/api` 配下の Next.js **API Routes** で実装しています。

### GET `/api/todos`
- 概要：Todo一覧取得
- 成功：`200` Todo配列

### POST `/api/todos`
- 概要：Todo新規作成
- body（例）：
```json
{
  "title": "Buy milk",
  "date": "2026-01-08",
  "priority": "high"
}
````

* 成功：`201` 作成したTodo
* 失敗：`400` バリデーションエラー

### DELETE `/api/todos?id={id}`

* 概要：Todo削除
* 成功：`200` `{ "message": "Todo deleted successfully" }`
* 失敗：`400` id不正 / `404`（未存在の場合は実装により） / `500`

### PUT `/api/todos`

* 概要：Todo完全置換（全項目必須）
* body（例）：

```json
{
  "id": 1,
  "title": "New title",
  "date": "2026-01-08",
  "priority": "low"
}
```

* 成功：`200` 更新後Todo
* 失敗：`400` / `404` / `500`

### PATCH `/api/todos`

* 概要：Todo部分更新（更新項目は任意）
* body（例）：

```json
{
  "id": 1,
  "title": "Updated title"
}
```

* 成功：`200` 更新後Todo
* 失敗：`400` / `404` / `500`

---

## バリデーション

* 共通ロジック：`utils/validation`
* 例：

  * 作成時：`validateTodoInput(title, date, priority)`
  * 完全置換：`validateCompleteTodoInput({ title, date, priority })`
  * ID：`validateId(id)`

---

## エラーハンドリング

* 共通ロジック：`utils/errorHandler`
* API側では `try-catch` を行い、例外は `handleError(res, error, message)` に寄せて返却方針を統一します。

---

## テスト

* **APIテスト**：Thunder Client で正常系・異常系を確認
* **ユニットテスト**：Vitest でバリデーション・共通ロジックを検証

---

## CI/CD

* **CI（GitHub Actions）**：Push／Pull Request でビルド＆テストを自動実行
* **デプロイ**：Vercel（連携している場合）

---

## ローカル起動手順

### 1) 依存関係インストール

```bash
npm install
```

### 2) 環境変数の設定

`.env.local` を作成し、Neonの接続情報を設定してください。

例：

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"
```

### 3) 開発サーバ起動

```bash
npm run dev
```

---

## 今後の拡張予定

* Prisma の導入とスキーマ定義
* Docker コンテナ化による一貫した開発環境の構築
* ユーザー認証（NextAuth.js または Clerk）
* タグ・カテゴリによるタスク分類機能
* 通知機能（期限アラート／メール連携）
* Firebase の導入

````

---

### 追加で直すと良い小ポイント（README品質が上がる）
- あなたの貼ってくれた本文に混ざっていた `markdown コードをコピーする` は README から削除でOK（コピーツールの混入っぽい）
- `utils/*` がツリーにないので、ツリーに `utils/` を追加すると読み手が迷いません  
  例：
  ```txt
  ├── utils/              # validation / errorHandler など
````
