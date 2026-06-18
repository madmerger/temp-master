using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TempMaster.App.Services;

public sealed class AppSettings
{
    public const string DefaultBaseUrl = "https://temp-master.fly.dev";
    public const int MinRefreshSeconds = 10;

    [JsonPropertyName("baseUrl")]
    public string BaseUrl { get; set; } = DefaultBaseUrl;

    [JsonPropertyName("refreshSeconds")]
    public int RefreshSeconds { get; set; } = 30;

    [JsonIgnore]
    public int EffectiveRefreshSeconds => Math.Max(MinRefreshSeconds, RefreshSeconds);

    /// <summary>
    /// Overrides the directory used for persistence. Intended for tests so they
    /// do not write to the real user profile.
    /// </summary>
    internal static string? DirectoryOverride { get; set; }

    private static string SettingsDirectory => DirectoryOverride ?? Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "TempMaster");

    private static string SettingsPath => Path.Combine(SettingsDirectory, "settings.json");

    public static AppSettings Load()
    {
        try
        {
            var path = SettingsPath;
            if (File.Exists(path))
            {
                var json = File.ReadAllText(path);
                var loaded = JsonSerializer.Deserialize<AppSettings>(json);
                if (loaded is not null)
                {
                    if (!Uri.TryCreate(loaded.BaseUrl?.Trim(), UriKind.Absolute, out _))
                    {
                        loaded.BaseUrl = DefaultBaseUrl;
                    }

                    return loaded;
                }
            }
        }
        catch
        {
            // Fall back to defaults on any read/parse failure.
        }

        return new AppSettings();
    }

    public void Save()
    {
        try
        {
            var path = SettingsPath;
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            var json = JsonSerializer.Serialize(this, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(path, json);
        }
        catch
        {
            // Persisting settings is best-effort.
        }
    }
}
