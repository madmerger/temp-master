using System.Diagnostics;
using System.Drawing;
using FlaUI.Core;
using FlaUI.Core.AutomationElements;
using FlaUI.Core.Definitions;
using FlaUI.Core.Input;
using FlaUI.Core.Tools;
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
        var window = GetMainWindow(app, automation);

        WaitUntil(() => Find(window, "ConnectionStatus").Name == "Connected");
        Assert.Equal("Temp Master Dashboard", window.Title);
        Assert.Equal("Connected", Find(window, "ConnectionStatus").Name);
        SaveScreenshot(window, "active-charts");

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
            var automationId = $"MeterCard_{ActiveDeviceIds[index]}";
            WaitForElement(window, automationId);
            Assert.NotNull(Find(window, automationId));
        }

        Assert.NotNull(Find(window, "StaleSection"));
        ScrollToBottom(window);
        foreach (var deviceId in StaleDeviceIds)
        {
            var automationId = $"MeterCard_{deviceId}";
            WaitForElement(window, automationId);
            Assert.NotNull(Find(window, automationId));
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
            var window = GetMainWindow(app, automation);
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
            var window = GetMainWindow(app, automation);
            WaitUntil(() => Find(window, "CurrentTheme").Name == changedTheme);
            WaitUntil(() => Find(window, "ConnectionStatus").Name == "Connected");
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
        var window = GetMainWindow(app, automation);
        WaitUntil(() => Find(window, "ConnectionStatus").Name == "Connected");

        var timeRangeBounds = Find(window, "TimeRangeSelector").BoundingRectangle;
        var refreshBounds = Find(window, "RefreshButton").BoundingRectangle;
        Assert.False(timeRangeBounds.IntersectsWith(refreshBounds));
        Assert.True(refreshBounds.Left > timeRangeBounds.Right);

        Find(window, "TimeRangeSelector")
            .AsComboBox()
            .Select("Last 7 Days");
        WaitUntil(() => Find(window, "ConnectionStatus").Name == "Connected");

        Assert.Equal("Connected", Find(window, "ConnectionStatus").Name);
        SaveScreenshot(window, "week-range");
    }

    private static AutomationElement Find(Window window, string automationId) =>
        window.FindFirstDescendant(element => element.ByAutomationId(automationId))
        ?? throw new InvalidOperationException($"Automation element '{automationId}' was not found.");

    private static Window GetMainWindow(Application app, AutomationBase automation) =>
        Retry.WhileException(
            () => app.GetMainWindow(automation, TimeSpan.FromSeconds(1))
                ?? throw new InvalidOperationException("The dashboard window is not available yet."),
            TimeSpan.FromSeconds(30),
            TimeSpan.FromMilliseconds(250),
            true,
            "The dashboard window was not available.")
        .Result
        ?? throw new TimeoutException("The dashboard window was not available.");

    private static void WaitForElement(Window window, string automationId) =>
        WaitUntil(() => window.FindFirstDescendant(element => element.ByAutomationId(automationId)) is not null);

    private static void ScrollToBottom(Window window)
    {
        var scrollBar = window.FindFirstDescendant(element => element.ByControlType(ControlType.ScrollBar))
            ?.AsVerticalScrollBar()
            ?? throw new InvalidOperationException("The dashboard scroll bar was not found.");
        var bounds = window.BoundingRectangle;
        Mouse.MoveTo(new Point(bounds.X + bounds.Width / 2, bounds.Y + bounds.Height / 2));
        while (scrollBar.Value < scrollBar.MaximumValue)
        {
            var previousValue = scrollBar.Value;
            Mouse.Scroll(-3);
            WaitUntil(() => scrollBar.Value > previousValue);
        }
    }

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
        window.SetForeground();
        WaitUntil(() => !window.IsOffscreen && Find(window, "ConnectionStatus").Name == "Connected");

        var captureTimeout = Stopwatch.StartNew();
        do
        {
            window.CaptureToFile(screenshotPath);
            using var bitmap = new Bitmap(screenshotPath);
            if (HasVisibleContent(bitmap))
            {
                return;
            }

            Thread.Sleep(100);
        }
        while (captureTimeout.Elapsed < TimeSpan.FromSeconds(5));

        throw new TimeoutException($"The window did not render before screenshot capture: {name}.");
    }

    private static bool HasVisibleContent(Bitmap bitmap)
    {
        var left = bitmap.Width / 10;
        var right = bitmap.Width * 9 / 10;
        var top = Math.Max(bitmap.Height / 10, 32);
        var bottom = bitmap.Height * 9 / 10;
        var horizontalStep = Math.Max(1, bitmap.Width / 32);
        var verticalStep = Math.Max(1, bitmap.Height / 32);
        for (var y = top; y < bottom; y += verticalStep)
        {
            for (var x = left; x < right; x += horizontalStep)
            {
                var pixel = bitmap.GetPixel(x, y);
                if (pixel.R > 8 || pixel.G > 8 || pixel.B > 8)
                {
                    return true;
                }
            }
        }

        return false;
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
