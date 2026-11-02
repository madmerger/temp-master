using System.Text.Json;
using Microsoft.UI.Dispatching;
using Microsoft.UI.Xaml;
using Windows.UI.ViewManagement;

namespace SwitchBotDashboard.App;

public enum ThemePreference
{
    System,
    Light,
    Dark,
}

public sealed class ThemeService : IDisposable
{
    private readonly UISettings _systemSettings = new();
    private readonly string _settingsPath;
    private FrameworkElement? _root;
    private DispatcherQueue? _dispatcherQueue;
    private ThemePreference _preference;
    private bool _disposed;

    public ThemeService()
    {
        var settingsDirectory = Environment.GetEnvironmentVariable("SWITCHBOT_DASHBOARD_SETTINGS_DIR");
        if (string.IsNullOrWhiteSpace(settingsDirectory))
        {
            settingsDirectory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "SwitchBotDashboard");
        }

        _settingsPath = Path.Combine(settingsDirectory, "settings.json");
        _preference = LoadPreference();
    }

    public event EventHandler? ThemeChanged;

    public string EffectiveTheme => _preference switch
    {
        ThemePreference.Dark => "Dark",
        ThemePreference.Light => "Light",
        ThemePreference.System => IsSystemDark() ? "Dark" : "Light",
        _ => "Light",
    };

    public bool IsExplicitDark => _preference == ThemePreference.Dark;

    public void Apply(FrameworkElement root, DispatcherQueue dispatcherQueue)
    {
        _root = root;
        _dispatcherQueue = dispatcherQueue;
        _systemSettings.ColorValuesChanged += OnSystemColorValuesChanged;
        ApplyTheme();
    }

    public void SetExplicitTheme(bool isDark)
    {
        _preference = isDark ? ThemePreference.Dark : ThemePreference.Light;
        SavePreference();
        ApplyTheme();
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _systemSettings.ColorValuesChanged -= OnSystemColorValuesChanged;
        _disposed = true;
    }

    private ThemePreference LoadPreference()
    {
        try
        {
            if (!File.Exists(_settingsPath))
            {
                return ThemePreference.System;
            }

            var settings = JsonSerializer.Deserialize<Settings>(File.ReadAllText(_settingsPath));
            return settings?.Preference ?? ThemePreference.System;
        }
        catch (IOException)
        {
            return ThemePreference.System;
        }
        catch (JsonException)
        {
            return ThemePreference.System;
        }
    }

    private void SavePreference()
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_settingsPath)!);
        File.WriteAllText(
            _settingsPath,
            JsonSerializer.Serialize(new Settings(_preference), new JsonSerializerOptions { WriteIndented = true }));
    }

    private bool IsSystemDark()
    {
        var background = _systemSettings.GetColorValue(UIColorType.Background);
        return background.R + background.G + background.B < 3 * 128;
    }

    private void OnSystemColorValuesChanged(UISettings sender, object args)
    {
        if (_preference == ThemePreference.System)
        {
            _dispatcherQueue?.TryEnqueue(ApplyTheme);
        }
    }

    private void ApplyTheme()
    {
        if (_root is not null)
        {
            _root.RequestedTheme = _preference switch
            {
                ThemePreference.Light => ElementTheme.Light,
                ThemePreference.Dark => ElementTheme.Dark,
                _ => ElementTheme.Default,
            };
        }

        ThemeChanged?.Invoke(this, EventArgs.Empty);
    }

    private sealed record Settings(ThemePreference Preference);
}
