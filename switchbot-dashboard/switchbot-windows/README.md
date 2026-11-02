# Temp Master Dashboard for Windows

Build and run the unpackaged WinUI 3 app on Windows 10 version 1809 or later with the .NET 8 SDK:

```powershell
dotnet build .\src\SwitchBotDashboard.App\SwitchBotDashboard.App.csproj -c Release -p:Platform=x64
dotnet run --project .\src\SwitchBotDashboard.App\SwitchBotDashboard.App.csproj -- --mock-data
```

Run with `--mock-data` for the deterministic dashboard scenario. For live data, omit that argument and set `SWITCHBOT_API_URL`, or pass `--api-url <url>`. On Windows, `.\run-ui-tests.ps1` builds the app and runs the Core and UI test suites in an interactive desktop session.

Linux supports building and testing `SwitchBotDashboard.Core` and `SwitchBotDashboard.Core.Tests`; WinUI 3 and UI automation tests require Windows.
