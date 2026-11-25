# Temp Master Dashboard

SwitchBot メーターの温度、湿度、バッテリーを監視する pnpm ワークスペースです。

| パス | 内容 |
| --- | --- |
| `apps/web` | React 19、TypeScript、Vite、Tailwind CSS、Recharts のダッシュボード |
| `apps/ios` | Expo と React Native の iOS アプリ |
| `packages/shared` | 型付き API クライアント、日本語の機器名エイリアス、未更新判定、日時フォーマット |
| `switchbot-dashboard/switchbot-backend` | FastAPI と SQLite の既存バックエンド |

## セットアップ

Node.js 24 と pnpm はリポジトリルートで使用します。

```sh
corepack enable
pnpm install --frozen-lockfile
```

### Web

```sh
pnpm dev
```

表示先は http://localhost:5173 です。30 秒ごとに取得し、1 時間、24 時間、7 日、30 日、1 年で履歴を切り替えられます。7 日以上更新されていないメーターは警告欄に表示し、履歴を取得しません。テーマは初回に端末設定に従い、ライト・ダーク・システムの選択をブラウザーに保存します。

| 環境変数 | 用途 |
| --- | --- |
| `VITE_API_URL` | メーター、履歴、手動更新、接続状態の取得先。未指定時は `https://snakeroom.fly.dev`。空文字列で同一オリジンの `/api` を使用 |
| `API_PROXY_TARGET` | Vite の開発・プレビューでローカル接続からのダッシュボード API リクエストを転送する先。指定した場合に有効 |

バックアップは画面配信元の `/api/backup` からダウンロードします。ローカルの FastAPI を起動し、`API_PROXY_TARGET=http://127.0.0.1:8000 VITE_API_URL= pnpm dev` を実行すると、ローカルのブラウザーからメーターデータとバックアップを取得できます。

### iOS

```sh
pnpm ios
```

対応する Expo Go から QR コードを読み込むか、macOS で `pnpm --filter @temp-master/ios ios` を実行して iOS シミュレーターを開きます。一覧を下に引くと更新します。更新済みメーターをタップすると直近 24 時間の温度履歴が開きます。テーマは iOS の設定に従います。

`EXPO_PUBLIC_API_URL` で取得先を変更できます。未指定時は Web と同じ `https://snakeroom.fly.dev` を使用します。ローカル FastAPI を実機から使う場合は、実機から到達できるホストの URL を指定します。

### バックエンド

FastAPI の開発手順と API の一覧は [バックエンドのセットアップ](switchbot-dashboard/README.md) を参照してください。

## 検証とビルド

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker build -f switchbot-dashboard/Dockerfile -t temp-master .
```

Web の成果物は `apps/web/dist/` に出力されます。Docker は Web をビルドし、成果物を FastAPI の静的配信ディレクトリへコピーします。Docker で Web の取得先を指定するには `--build-arg VITE_API_URL=...` を使います。Fly.io のデプロイは `main` へのプッシュ時に、リポジトリルートをビルドコンテキストとして実行します。