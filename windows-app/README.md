# Temp Master Dashboard — Windows Native (WPF)

A native Windows desktop edition of the Temp Master SwitchBot dashboard. It
reuses the existing FastAPI backend (the same endpoints the legacy web frontend
uses) and presents the data with a native Windows look — standard menu bar,
toolbar, combo box, status bar, and window chrome.

## Features

- Live grid of meter cards (temperature / humidity / battery badges).
- Per-device temperature trend chart drawn with native WPF primitives
  (no external charting dependency).
- Chemical-plant style display names, mirroring the web dashboard.
- Time range selector (Last Hour / 24 Hours / 7 Days / 30 Days / Year).
- Manual **Refresh Data** plus automatic refresh every 30 seconds.
- **Download Backup** opens the backend's `/api/backup` export.
- Connection status indicator and rate-limit banner.

## Tech stack

- .NET 10 (`net10.0-windows`), WPF.
- `System.Net.Http.Json` for the API client; `System.Text.Json` for models.

## Building

```powershell
dotnet build windows-app/TempMaster.Desktop.sln -c Release
```

## Running

```powershell
dotnet run --project windows-app/src/TempMaster.Desktop/TempMaster.Desktop.csproj
```

By default the app talks to the production backend at
`https://temp-master.fly.dev`. To point at a local backend, change
`TempMasterApiClient.DefaultBaseUrl`.
