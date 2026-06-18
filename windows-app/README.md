# Temp Master Desktop

Windowsネイティブデスクトップアプリケーション（WPF / .NET 8）。  
Temp Master ダッシュボードのウェブ版と同等の機能を提供します。

## 機能

- SwitchBot メーターのリアルタイム温度・湿度・バッテリー表示
- OxyPlot による温度履歴チャート
- タイムレンジ切替（1時間/24時間/7日間/30日間/1年）
- 30秒間隔の自動リフレッシュ
- ダークテーマ UI
- ケミカルプラント風の産業用デバイス名表示

## 必要環境

- Windows 10 以降
- .NET 8.0 Runtime

## ビルド方法

```powershell
cd windows-app
dotnet build
```

## 実行方法

```powershell
cd windows-app
dotnet run --project src/TempMasterDesktop
```

## アーキテクチャ

- **MVVM パターン**: ViewModel がデータバインディングを管理
- **OxyPlot**: 温度チャートの描画
- **HttpClient**: Temp Master バックエンド API との通信
- **DispatcherTimer**: 定期的なデータ更新

## API 接続先

デフォルトで `https://temp-master.fly.dev` に接続します。
