using Microsoft.UI.Xaml;
using SwitchBotDashboard.Core;
using SwitchBotDashboard.Core.Api;

namespace SwitchBotDashboard.App;

public sealed partial class App : Application
{
    private HttpClient? _httpClient;
    private MainWindow? _mainWindow;

    public App()
    {
        InitializeComponent();
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        var commandLine = Environment.GetCommandLineArgs().Skip(1).ToArray();
        var useMockData = commandLine.Contains("--mock-data", StringComparer.OrdinalIgnoreCase);
        IDashboardApi api;
        TimeProvider timeProvider;

        if (useMockData)
        {
            api = new MockDashboardApi();
            timeProvider = new ScenarioTimeProvider(MockDashboardApi.ScenarioNow);
        }
        else
        {
            _httpClient = new HttpClient();
            api = new DashboardApiClient(_httpClient, GetApiBaseUrl(commandLine));
            timeProvider = TimeProvider.System;
        }

        _mainWindow = new MainWindow(new DashboardViewModel(api, timeProvider));
        _mainWindow.Activate();
    }

    private static Uri GetApiBaseUrl(IReadOnlyList<string> commandLine)
    {
        var argumentIndex = Array.FindIndex(
            commandLine.ToArray(),
            argument => string.Equals(argument, "--api-url", StringComparison.OrdinalIgnoreCase));
        var argumentUrl = argumentIndex >= 0 && argumentIndex + 1 < commandLine.Count
            ? commandLine[argumentIndex + 1]
            : null;
        var configuredUrl = Environment.GetEnvironmentVariable("SWITCHBOT_API_URL");
        var value = argumentUrl ?? configuredUrl ?? "https://snakeroom.fly.dev";
        return Uri.TryCreate(value, UriKind.Absolute, out var uri)
            ? uri
            : throw new ArgumentException("The API URL must be an absolute URI.", nameof(commandLine));
    }

    private sealed class ScenarioTimeProvider(DateTimeOffset scenarioNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => scenarioNow;
    }
}
