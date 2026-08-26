# Database migration runbook

## 対象

この文書は、My TodoのPostgreSQL migrationをproductionへ適用する際の
確認、実行、検証、復旧手順を定義する。

## 正本

- Migration: `migrations/`
- Migration履歴: `public.schema_migrations`
- Production table: `public.todos`
- Production migration: `yarn db:migrate:production`
- Production verification: `yarn db:verify:production`

productionとtestは、同じmigrationファイルを使用する。

## 安全ルール

- productionへ`test:db`を実行しない
- productionへ`test:cleanup`を実行しない
- `DATABASE_URL`をログ、Issue、PRへ記載しない
- migrationは`main`のレビュー済みcommitから実行する
- production migrationはGitHub Environmentの承認後に実行する
- baseline migrationに対して`down`を実行しない
- production上でmigrationを手動修正しない

## 適用前確認

- [ ] `yarn lint`が成功している
- [ ] `yarn test:coverage`が成功している
- [ ] `yarn test:db`が成功している
- [ ] GitHub Actionsが成功している
- [ ] Vercel Previewが正常に動作している
- [ ] Neon productionから検証用子ブランチを作成した
- [ ] 子ブランチでmigrationが成功した
- [ ] 子ブランチでschema検証が成功した
- [ ] migration実行時刻と対象commit SHAを記録した
- [ ] Neonのhistory windowを確認した

## データ件数の記録

migration前にNeon SQL Editorで実行し、結果を記録する。

```sql
SELECT
  count(*)::bigint AS todo_count,
  max(id) AS maximum_todo_id
FROM public.todos;
```

タイトルなどの実データは記録しない。

## Production適用前のGitHub設定

GitHubの`Settings` → `Environments`で、
`production-database` Environmentを作成する。

次を設定する。

- Deployment branches: `main`のみ
- Required reviewers: 承認者を設定
- Environment secret: `PRODUCTION_DATABASE_URL`

`PRODUCTION_DATABASE_URL`にはNeon productionの接続URLを設定する。

次を確認する。

- Database: `tododb`
- 接続先: Neon mainのPooler host
- `sslmode=verify-full`
- 接続URLをIssue、PR、ログへ貼り付けない

## Production適用

1. 対象PRがレビューされ、`main`へマージ済みであることを確認する
2. GitHubの`Actions`を開く
3. `Migrate production database`を選択する
4. `Run workflow`を押す
5. Branchに`main`を選択する
6. confirmationへ`migrate-production`と入力する
7. Workflowを開始する
8. `validate`ジョブが成功することを確認する
9. `production-database`の承認を行う
10. `Apply production migrations`が成功することを確認する
11. `Verify production database`が成功することを確認する

## 適用後確認

次のSQLで、migration前後の件数と最大IDを比較する。

```sql
SELECT
  count(*)::bigint AS todo_count,
  max(id) AS maximum_todo_id
FROM public.todos;
```

次のSQLでmigration履歴を確認する。

```sql
SELECT
  id,
  name,
  run_on
FROM public.schema_migrations
ORDER BY id;
```

次の項目を確認する。

- [ ] `0001_adopt-or-create-todos`が1件だけ存在する
- [ ] Todo件数が予期せず減少していない
- [ ] 最大IDが予期せず小さくなっていない
- [ ] `Verify production database`が成功している
- [ ] Productionの`/api/health/db`が`200 OK`を返す
- [ ] Productionの`/api/todos`が`200 OK`を返す
- [ ] Vercel Runtime Logsに新しい5xxがない
- [ ] migration実行時刻、commit SHA、Workflow URLを記録した

## migration失敗時の復旧

### 共通対応

1. Workflowを再実行しない
2. Productionへの追加デプロイを停止する
3. 失敗したstep、commit SHA、実行時刻、Workflow URLを記録する
4. `DATABASE_URL`、SQL全文、実データをログやIssueへ記載しない
5. Production DBを手動で修正しない
6. baseline migrationへ`down`を実行しない

### migration stepが失敗した場合

このmigrationは`--single-transaction`で実行されるため、
失敗時はtransaction全体のロールバックが期待される。

ただし、推測だけで再実行せず、次を確認する。

```sql
SELECT
  id,
  name,
  run_on
FROM public.schema_migrations
ORDER BY id;
```

```sql
SELECT
  count(*)::bigint AS todo_count,
  max(id) AS maximum_todo_id
FROM public.todos;
```

確認事項：

- [ ] 失敗したmigrationの履歴が追加されていない
- [ ] migration前からデータ件数が減少していない
- [ ] Productionのヘルスチェックが成功する
- [ ] Productionアプリが継続して動作する

原因を修正した新しいcommitを作成し、Neon子ブランチで
migrationとschema検証を最初からやり直す。

### migrationは成功したがschema verificationが失敗した場合

この場合、schema変更はcommit済みの可能性がある。

1. Workflowを再実行しない
2. `down`を実行しない
3. Productionのmigration履歴を確認する
4. NeonのRestore画面を開く
5. migration直前時刻から復旧確認用ブランチを作成する
6. 復旧確認用ブランチで件数、schema、migration履歴を確認する
7. forward migrationとProduction restoreのどちらを採用するか判断する

可能な場合は、既存のProductionを巻き戻すより、
新しいforward migrationで修正する。

Production restoreは、復元時刻より後の書き込みを失う可能性があるため、
影響範囲、停止時間、復元時刻を確認し、明示的な承認後にのみ実行する。

### Neonで復旧確認用ブランチを作成する

1. Neon Consoleで対象プロジェクトを開く
2. `Restore`または`Branches`を開く
3. migration直前の日時を選択する
4. Productionを直接restoreせず、新しいブランチとして作成する
5. Databaseに`tododb`を選択する
6. データ件数とschemaを確認する
7. 復旧内容が正しいことを確認してから最終判断する

## 実行記録

- 実行日時:
- 対象commit SHA:
- GitHub Actions Workflow URL:
- migration前のTodo件数:
- migration前の最大ID:
- migration後のTodo件数:
- migration後の最大ID:
- migration結果:
- schema verification結果:
- Vercelヘルスチェック結果:
- 復旧判断:
