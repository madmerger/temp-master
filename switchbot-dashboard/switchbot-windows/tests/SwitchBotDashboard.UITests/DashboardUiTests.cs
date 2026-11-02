using System.Diagnostics;
using FlaUI.Core;
using FlaUI.Core.AutomationElements;
using FlaUI.UIA3;
using Xunit;

namespace SwitchBotDashboard.UITests;

public sealed class DashboardUiTests
{
    private static readonly string[] ActiveDeviceIds =
    [
        "C76B0046301A",
        "D13234351576",
        "B0E9FEB9CFA6",
        "A1B2C3D4E5F6",
    ];

    private static readonly string[] StaleDeviceIds =
    [
        "F577B677EC96",
        "000000000000",
    ];

    [WindowsFact]
    public void MockDashboardShowsActiveAndStaleMeters()
    {
        using var environment = TestEnvironment.Start();
        using var automation = new UIA3Automation();
        using var app = Application.Launch(environment.AppPath, "--mock-data");
        var window = app.GetMainWindow(automation);

        WaitUntil(() => Find(window, "ConnectionStatus").Name == "Connected");
        Assert.Equal("Temp Master Dashboard", window.Title);
        Assert.Equal("Connected", Find(window, "ConnectionStatus").Name);

        var expectedNames = new[]
        {
            "第1蒸留塔 (T-101)",
            "冷却塔 (CT-401)",
            "制御盤 (CP-1602)",
            "Garage Sensor",
        };
        for (var index = 0; index < ActiveDeviceIds.Length; index++)
        {
            Assert.Equal(
                expectedNames[index],
                Find(window, $"MeterName_{ActiveDeviceIds[index]}").Name);
            Assert.NotNull(Find(window, $"MeterCard_{ActiveDeviceIds[index]}"));
        }

        Assert.NotNull(Find(window, "StaleSection"));
        foreach (var deviceId in StaleDeviceIds)
        {
            Assert.NotNull(Find(window, $"MeterCard_{deviceId}"));
        }

        Assert.NotNull(window.FindFirstDescendant(element => element.ByName("No data received")));
        SaveScreenshot(window, "mock-dashboard");
    }

    [WindowsFact]
    public void ThemeTogglePersistsAcrossRelaunch()
    {
        using var environment = TestEnvironment.Start();
        string changedTheme;
        using (var automation = new UIA3Automation())
        using (var app = Application.Launch(environment.AppPath, "--mock-data"))
        {
            var window = app.GetMainWindow(automation);
            WaitUntil(() => Find(window, "ConnectionStatus").Name == "Connected");
            var originalTheme = Find(window, "CurrentTheme").Name;
            Find(window, "ThemeToggle").Click();
            WaitUntil(() => Find(window, "CurrentTheme").Name != originalTheme);
            changedTheme = Find(window, "CurrentTheme").Name;
            SaveScreenshot(window, "theme-toggled");
        }

        using (var automation = new UIA3Automation())
        using (var app = Application.Launch(environment.AppPath, "--mock-data"))
        {
            var window = app.GetMainWindow(automation);
            WaitUntil(() => Find(window, "CurrentTheme").Name == changedTheme);
            Assert.Equal(changedTheme, Find(window, "CurrentTheme").Name);
            SaveScreenshot(window, "theme-restored");
        }
    }

    [WindowsFact]
    public void TimeRangeCanBeChangedWithoutDisconnecting()
    {
        using var environment = TestEnvironment.Start();
        using var automation = new UIA3Automation();
        using var app = Application.Launch(environment.AppPath, "--mock-data");
        var window = app.GetMainWindow(automation);
        WaitUntil(() => Find(window, "ConnectionStatus").Name == "Connected");

        window.FindFirstDescendant(element => element.ByAutomationId("TimeRangeSelector"))
            .AsComboBox()
            .Select("Last 7 Days");
        WaitUntil(() => Find(window, "ConnectionStatus").Name == "Connected");

        Assert.Equal("Connected", Find(window, "ConnectionStatus").Name);
        SaveScreenshot(window, "week-range");
    }

    private static AutomationElement Find(Window window, string automationId) =>
        window.FindFirstDescendant(element => element.ByAutomationId(automationId))
        ?? throw new InvalidOperationException($"Automation element '{automationId}' was not found.");

    private static void WaitUntil(Func<bool> predicate)
    {
        var stopwatch = Stopwatch.StartNew();
        while (!predicate())
        {
            if (stopwatch.Elapsed > TimeSpan.FromSeconds(15))
            {
                throw new TimeoutException("The expected dashboard state was not reached.");
            }

            Thread.Sleep(100);
        }
    }

    private static void SaveScreenshot(Window window, string name)
    {
        var screenshotDirectory = Environment.GetEnvironmentVariable("SWITCHBOT_TEST_RESULTS_DIR")
            ?? Path.Combine(Directory.GetCurrentDirectory(), "TestResults");
        var screenshotPath = Path.Combine(screenshotDirectory, "screenshots", $"{name}.png");
        Directory.CreateDirectory(Path.GetDirectoryName(screenshotPath)!);
        window.CaptureToFile(screenshotPath);
    }

    private sealed class TestEnvironment : IDisposable
    {
        private TestEnvironment(string appPath, string settingsDirectory)
        {
            AppPath = appPath;
            SettingsDirectory = settingsDirectory;
            Environment.SetEnvironmentVariable("SWITCHBOT_DASHBOARD_SETTINGS_DIR", SettingsDirectory);
        }

        public string AppPath { get; }

        public string SettingsDirectory { get; }

        public static TestEnvironment Start()
        {
            var configuredPath = Environment.GetEnvironmentVariable("SWITCHBOT_APP_EXE");
            var repositoryRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../"));
            var defaultPath = Path.Combine(
                repositoryRoot,
                "src",
                "SwitchBotDashboard.App",
                "bin",
                "x64",
                "Release",
                "net8.0-windows10.0.19041.0",
                "SwitchBotDashboard.App.exe");
            var appPath = configuredPath ?? defaultPath;
            if (!File.Exists(appPath))
            {
                throw new FileNotFoundException("Build the WinUI app before running the UI tests.", appPath);
            }

            var settingsDirectory = Path.Combine(
                Path.GetTempPath(),
                "SwitchBotDashboard",
                Guid.NewGuid().ToString("N"));
            return new TestEnvironment(appPath, settingsDirectory);
        }

        public void Dispose()
        {
            Environment.SetEnvironmentVariable("SWITCHBOT_DASHBOARD_SETTINGS_DIR", null);
            if (Directory.Exists(SettingsDirectory))
            {
                Directory.Delete(SettingsDirectory, recursive: true);
            }
        }
    }
}
