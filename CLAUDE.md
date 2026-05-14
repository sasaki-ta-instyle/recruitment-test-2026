# recruitment-test-2026

INSTYLE GROUP 採用カルチャーテスト 2026（v6 ipsative）。受験者ページ・面接官ガイド・受験者ダッシュボードを 1 つの Next.js + Prisma アプリで提供する。

## デプロイ設定（Claude Code 用）

| キー | 値 |
|---|---|
| CATEGORY | `app` |
| APP_NAME | `recruitment-test-2026` |
| PORT | `3007` |
| 公開URL | `https://app.instyle.group/recruitment-test-2026/` |
| HEALTHCHECK_PATH | `/recruitment-test-2026/api/health` |
| USE_DB | `true` |
| MIGRATE_CMD | `npx --yes --package=prisma@^6 -- prisma migrate deploy` |
| PM2名 | `app-recruitment-test-2026` |
| サーバ側パス | `/var/www/app/recruitment-test-2026/` |
| アプリ固有 env | `/var/www/_shared/apps/app-recruitment-test-2026.env` |

### GitHub Variables / Secrets で必要なもの

`sasaki-ta-instyle/recruitment-test-2026` リポジトリに以下を設定：

- Variables: `CATEGORY=app` / `APP_NAME=recruitment-test-2026` / `HEALTHCHECK_PATH=/recruitment-test-2026/api/health` / `USE_DB=true` / `MIGRATE_CMD=npx --yes --package=prisma@^6 -- prisma migrate deploy`
- Secrets: 組織レベルの `CONOHA_HOST` / `CONOHA_PORT` / `CONOHA_USER` / `CONOHA_SSH_KEY` を継承

## 構成

- `app/` — App Router
  - `app/test/` — 受験者向け（intro → Part1 ipsative → Part2 記述 → 結果）
  - `app/interviewer-guide/` — 面接官ガイド（採点方針 / 16 タイプ / 採点シート）
  - `app/admin/` — 受験者一覧 + 詳細
  - `app/api/health/` — ヘルスチェック
  - `app/api/submit/` — 受験者の最終提出を受け取って DB に保存
- `lib/questions.ts` — Part1 20 問 / Part2 10 問の定義（v6 spec）
- `lib/scoring.ts` — 4 軸 → 16 タイプ判定ロジック、tier・マッチ強度
- `lib/prisma.ts` — Prisma client singleton
- `middleware.ts` — `/interviewer-guide` と `/admin` に Basic 認証
- `prisma/schema.prisma` — Candidate / Part1Answer / Part2Answer / Score

## 環境変数

| キー | 用途 | 必須 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 接続文字列 | ✓ |
| `BASIC_AUTH_USER` | 面接官ページ Basic 認証 | ✓（本番） |
| `BASIC_AUTH_PASS` | 同上 | ✓（本番） |

開発時に `BASIC_AUTH_*` が未設定なら、middleware は警告ログを出して通す（`NODE_ENV !== 'production'` のみ）。

## デザインシステム

Flat（instyle.group デザインシステム）。`app/globals.css` の CSS 変数で完結。フォントは Gen Interface JP / Gen Interface JP Display を CDN から読み込み。Tailwind は使用しない。

## ローカル開発

```bash
# 初回
pnpm install
cp .env.example .env.local
# .env.local の DATABASE_URL と BASIC_AUTH_* を埋める
pnpm prisma migrate dev --name init   # DB を初期化
pnpm dev
# http://localhost:3007/recruitment-test-2026/ でアクセス
```

### 出典

`Workspace_yamada/test_matrix/instyle_culture_test_v5.html` / `instyle_interviewer_guide.html` を移植元として実装。Part1 ipsative ロジック・Fisher-Yates シャッフル・16 タイプ判定マトリクスはそこからの忠実な移植。

## 本番デプロイ

「本番にあげて」と Claude Code に指示すると、`gh workflow run deploy-prod.yml --ref main` で GitHub Actions が走り、ConoHa VPS にデプロイされる。

### 初回 ConoHa セットアップ（このアプリ用）

```bash
# 1. アプリディレクトリ
ssh conoha-deploy 'mkdir -p /var/www/app/recruitment-test-2026/{releases,shared} \
  && touch /var/www/_shared/apps/app-recruitment-test-2026.env \
  && chmod 600 /var/www/_shared/apps/app-recruitment-test-2026.env'

# 2. 共有 env に DATABASE_URL / BASIC_AUTH_USER / BASIC_AUTH_PASS を追記
ssh conoha-deploy 'vi /var/www/_shared/apps/app-recruitment-test-2026.env'

# 3. PostgreSQL DB 作成（ConoHa 上）
ssh conoha-root 'sudo -u postgres psql -c "CREATE DATABASE recruitment_test_2026;" \
  && sudo -u postgres psql -c "CREATE USER recruitment_test_user WITH ENCRYPTED PASSWORD '\''<gen-pw>'\'';" \
  && sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE recruitment_test_2026 TO recruitment_test_user;"'

# 4. Nginx location（exact + ^~ prefix の 2 段で trailing-slash 308 ループ回避）
ssh conoha-root 'cat > /etc/nginx/conf.d/proxy-apps/app/recruitment-test-2026.conf <<"EOF"
location = /recruitment-test-2026 {
  include snippets/proxy-next.conf;
  proxy_pass http://127.0.0.1:3007;
}
location ^~ /recruitment-test-2026/ {
  include snippets/proxy-next.conf;
  proxy_pass http://127.0.0.1:3007;
}
EOF
nginx -t && systemctl reload nginx'
```

## ロールバック

GitHub Actions 側のヘルスチェック失敗時は自動で前 release に戻る。手動で戻す場合:

```bash
ssh conoha-deploy '
cd /var/www/app/recruitment-test-2026/releases
ls -lt
ln -sfn <previous-sha> ../current.new && mv -T ../current.new ../current
pm2 reload app-recruitment-test-2026 --update-env
'
```
