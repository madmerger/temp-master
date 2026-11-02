$ErrorActionPreference = "Stop"

Write-Host "This script requires Windows 10 version 1809+ and an interactive desktop session."

$root = $PSScriptRoot
$resultsDirectory = Join-Path $root "TestResults"
$appProject = Join-Path $root "src\SwitchBotDashboard.App\SwitchBotDashboard.App.csproj"
$appExecutable = Join-Path $root "src\SwitchBotDashboard.App\bin\x64\Release\net8.0-windows10.0.19041.0\SwitchBotDashboard.App.exe"
$coreTests = Join-Path $root "tests\SwitchBotDashboard.Core.Tests\SwitchBotDashboard.Core.Tests.csproj"
$uiTests = Join-Path $root "tests\SwitchBotDashboard.UITests\SwitchBotDashboard.UITests.csproj"

New-Item -ItemType Directory -Force -Path $resultsDirectory | Out-Null
$env:SWITCHBOT_TEST_RESULTS_DIR = $resultsDirectory

dotnet build $appProject --configuration Release --property:Platform=x64
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:SWITCHBOT_APP_EXE = $appExecutable
dotnet test $coreTests --configuration Release --logger "trx;LogFileName=CoreTests.trx" --results-directory $resultsDirectory
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

dotnet test $uiTests --configuration Release --property:Platform=x64 --logger "trx;LogFileName=UITests.trx" --results-directory $resultsDirectory
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
