# Temp Master 監視盤 (Windows ネイティブ UI)

SwitchBot メーターを監視する Temp Master バックエンド（FastAPI）に接続する、Windows
ネイティブのデスクトップクライアントです。Web ダッシュボードと同じ API を利用し、
ケミカルプラント風の機器名でメーターを表示します。

## 主な機能

- メーター一覧をカード表示（温度・湿度・バッテリー・最終更新）
- ケミカルプラント機器名へのマッピング（Web 版 `DISPLAY_NAMES` と同一）
- 温度に応じた状態バッジ（正常 / 注意 / 警報）とバッテリー低下の強調表示
- 温度履歴の折れ線グラフ（外部チャートライブラリ非依存・自前描画）
- 期間切替（直近 1 時間 / 24 時間 / 7 日 / 30 日 / 1 年）
- 自動更新（既定 30 秒、最短 10 秒）と「今すぐ収集」ボタン
- 接続ステータス表示、バックエンド URL の変更・保存

## 技術スタック

- .NET 10 / WPF (C#)
- `System.Net.Http` + `System.Text.Json`（追加 NuGet 依存なし）
- xUnit によるユニットテスト

## ビルドと実行

```bash
cd windows-native
dotnet build -c Release
dotnet run --project src/TempMaster.App
```

> WPF アプリのため Windows 上でのみ実行できます。

## テスト

```bash
cd windows-native
dotnet test
```

## 設定

- バックエンド URL は既定で本番環境 `https://temp-master.fly.dev` を指します。
- 画面上のツールバーから URL と更新間隔（秒）を変更し「適用」で保存できます。
- 設定は `%LOCALAPPDATA%\TempMaster\settings.json` に保存されます。

## プロジェクト構成

```
windows-native/
  TempMaster.slnx
  src/TempMaster.App/
    Models/          API レスポンスのモデル
    Services/        API クライアント・表示名マッピング・状態判定・設定
    Charting/        UI 非依存のチャート座標計算（テスト対象）
    Controls/        LineChart（DrawingContext による自前描画）
    ViewModels/      MVVM の ViewModel
    Converters/      XAML バインディング用コンバーター
  tests/TempMaster.Tests/
```
