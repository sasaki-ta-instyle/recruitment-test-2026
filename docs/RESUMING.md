# recruitment-test-2026 再開手順

このドキュメントは、Claude Code セッションを終了したり別の Mac に切り替えた後で、
`recruitment-test-2026` の開発・運用作業をスムーズに再開するためのチェックリスト。

> **更新ルール:** このファイルを変更したら必ず main に push して、別 Mac / 別メンバーが
> 最新を取れる状態に保つ。秘密値そのものは絶対に書かない（取得元のリンクのみ）。

---

## 0. このアプリの基本情報

| 項目 | 値 |
|---|---|
| 公開 URL | `https://app.instyle.group/recruitment-test-2026/` |
| GitHub | `https://github.com/sasaki-ta-instyle/recruitment-test-2026`（Public） |
| ConoHa デプロイ先 | `/var/www/app/recruitment-test-2026/` |
| 共有 env | `/var/www/_shared/apps/app-recruitment-test-2026.env`（chmod 600） |
| PM2 名 | `app-recruitment-test-2026` |
| ポート | `3006` |
| Healthcheck | `/recruitment-test-2026/api/health` |
| USE_DB | `true`（PostgreSQL + Prisma） |

---

## 1. 同じ Mac で再開する

Claude Code を終了しただけなら、以下だけで OK。

```bash
claude
```

---

## 2. 別の Mac（サブ機 / 新メンバー）で再開する

### 2.1 Claude Code 環境を揃える

メイン Mac の `~/.claude` 配下は **`instyle-claude-sasaki` リポジトリ** が同期の正本。

### 2.2 ソースコードを取得

```bash
mkdir -p ~/Workspace
gh repo clone sasaki-ta-instyle/recruitment-test-2026 ~/Workspace/recruitment-test-2026
cd ~/Workspace/recruitment-test-2026
```

### 2.3 ローカル開発に必要なツール

```bash
brew install pnpm postgresql@16
brew services start postgresql@16
pnpm install
```

### 2.4 環境変数を配置

`.env.local` を作る：

```bash
cp .env.example .env.local
# DATABASE_URL は postgresql://<user>:<pw>@localhost:5432/recruitment_test_2026?schema=public
# BASIC_AUTH_USER / BASIC_AUTH_PASS は 1Password から取得（共有メモ：「採用テスト面接官ログイン」）
```

### 2.5 DB を初期化

```bash
createdb recruitment_test_2026
pnpm prisma migrate dev --name init
```

### 2.6 起動

```bash
pnpm dev
# → http://localhost:3006/recruitment-test-2026/
```

---

## 3. データ・状態の永続化マッピング

| 種類 | 場所 | 引き継ぎ方法 |
|---|---|---|
| ソースコード | GitHub `sasaki-ta-instyle/recruitment-test-2026` | `git clone` |
| 本番 DB | ConoHa Postgres `recruitment_test_2026` | サーバ側永続。pg_dump でバックアップ |
| 本番 env | ConoHa `/var/www/_shared/apps/app-recruitment-test-2026.env` | サーバ側永続 |
| 本番 Web プロセス | PM2 `app-recruitment-test-2026` | 触らない、`deploy-prod.yml` で更新 |
| ローカル `.env.local` | 各 Mac のローカル | 1Password 経由 |
| ローカル DB | 各 Mac のローカル Postgres | dev 用テストデータ、共有しない |

---

## 4. よくある運用コマンド

### 本番に新コードを反映する

```bash
gh workflow run deploy-prod.yml --ref main -R sasaki-ta-instyle/recruitment-test-2026
gh run watch -R sasaki-ta-instyle/recruitment-test-2026
```

### 本番 Prisma マイグレーションを手動で打つ

GitHub Actions の `Run migrations` ステップが自動で `pnpm migrate`（=`prisma migrate deploy`）を実行する。
手動で叩きたい場合：

```bash
ssh conoha-deploy '
cd /var/www/app/recruitment-test-2026/current
export $(grep -v "^#" .env.base | xargs)
export $(grep -v "^#" .env.app  | xargs)
pnpm migrate
'
```

### 本番 PM2 ログを覗く

```bash
ssh conoha-deploy 'pm2 logs app-recruitment-test-2026 --nostream --lines 50 --raw'
```

### 受験者データを pg_dump で吸い上げる

```bash
ssh conoha-deploy 'pg_dump -h localhost -U recruitment_test_user -d recruitment_test_2026 > ~/dump-$(date +%F).sql'
scp conoha-deploy:dump-*.sql ./
```

### ロールバック（手動）

```bash
ssh conoha-deploy '
cd /var/www/app/recruitment-test-2026/releases
ls -lt | head -5
ln -sfn <previous-sha> ../current.new && mv -T ../current.new ../current
pm2 reload app-recruitment-test-2026 --update-env
'
```

---

## 5. 残タスク / 未実装

| # | 内容 | 状態 |
|---|---|---|
| 1 | フラットDSの最終UI検証（受験者ページの可読性、ガイドの印刷品質） | pending |
| 2 | Part 2 各問の採点入力UI（10/7/4/0）と合計100点表示を admin に追加 | future |
| 3 | 旧 `instyle_admin_reference.html` の per-question 解説の取り込み | future |
| 4 | CSV エクスポート（admin → 受験者一括ダウンロード） | future |

---

## 6. 参考

- ConoHa 本番運用 runbook: `~/Workspace/docs/conoha-setup.md`
- ポート台帳: `~/Workspace/docs/conoha-port-registry.md`
- 移植元（v6 静的 HTML）: `Workspace_yamada/test_matrix/instyle_*.html`
- このアプリの `CLAUDE.md`: 設計判断・運用ルール
