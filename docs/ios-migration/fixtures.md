# テストフィクスチャ定義 (シード)

全タイムスタンプは **シード実行時刻 NOW (UTC)** からの相対値。シードはテスト実行 (環境ごと) の直前に毎回再投入する。
投入方法: クレデンシャル無し (`SWITCHBOT_TOKEN=""`, `SWITCHBOT_SECRET=""`) で起動したレガシーバックエンドに `POST /api/import`、その後 `latency_logs` を SQLite に直接 INSERT。

## デバイス (base.json)

| ID | device_name | device_type | temp | hum | battery | last_updated | readings (offset, temp, hum, battery) |
|---|---|---|---|---|---|---|---|
| SEED-D1 | Bedroom Meter | MeterPlus | 22.3 | 80 | 20 | NOW-5m | (-30m,22.3,80,20) (-2h,22.0,79,20) (-3d,21.5,78,21) (-10d,20.9,75,22) (-100d,18.2,70,25) |
| SEED-D2 | 外 | Meter | 12.5 | 55 | 90 | NOW-10m | (-45m,12.5,55,90) (-20h,10.1,60,90) (-6d,8.4,65,91) |
| SEED-D3 | Study Hub | Hub 3 | 23.2 | 75 | null | NOW-2m | (-15m,23.2,75,null) |
| SEED-D4 | アワコ | Meter | 19.0 | 60 | 5 | NOW-8d | (-8d,19.0,60,5) |
| SEED-D5 | ネズミ | Meter | null | null | null | null | なし |
| SEED-D6 | Tag <b>&</b> | Meter Pro CO2 | 25.0 | 40 | 100 | NOW-1m | (-1m,25.0,40,100) |

SEED-D1 の期間別件数: hour=1 / day=2 / week=3 / month=4 / year=5。

## 追加インポート (import_extra.json, TC-16 用)

| ID | device_name | device_type | temp | hum | battery | last_updated | readings |
|---|---|---|---|---|---|---|---|
| SEED-D7 | バロン | Meter | 26.4 | 50 | 77 | NOW-3m | (-3m,26.4,50,77) (-1h30m,26.0,52,77) |

## latency_logs (直接 INSERT)

| offset | endpoint | device_id | latency_ms | status_code | success | error_message |
|---|---|---|---|---|---|---|
| -60m | /devices | null | 120.5 | 200 | 1 | null |
| -50m | /devices/SEED-D1/status | SEED-D1 | 80.0 | 200 | 1 | null |
| -40m | /devices/SEED-D2/status | SEED-D2 | 50.0 | 429 | 0 | Rate limited. Backing off for 120 seconds |
| -30m | /devices/SEED-D3/status | SEED-D3 | 300.0 | 500 | 0 | Request error: timeout |

期待統計: total 4 / avg 137.625 / min 50.0 / max 300.0 / success 2 / failed 2 / success_rate 50.0
