using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace TempMaster.App.Models;

public sealed class Meter
{
    [JsonPropertyName("device_id")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("device_name")]
    public string DeviceName { get; set; } = string.Empty;

    [JsonPropertyName("device_type")]
    public string DeviceType { get; set; } = string.Empty;

    [JsonPropertyName("hub_device_id")]
    public string? HubDeviceId { get; set; }

    [JsonPropertyName("current_temperature")]
    public double? CurrentTemperature { get; set; }

    [JsonPropertyName("current_humidity")]
    public int? CurrentHumidity { get; set; }

    [JsonPropertyName("battery")]
    public int? Battery { get; set; }

    [JsonPropertyName("last_updated")]
    public DateTimeOffset? LastUpdated { get; set; }
}

public sealed class MetersResponse
{
    [JsonPropertyName("meters")]
    public List<Meter> Meters { get; set; } = new();

    [JsonPropertyName("last_updated")]
    public DateTimeOffset? LastUpdated { get; set; }
}

public sealed class MeterReading
{
    [JsonPropertyName("timestamp")]
    public DateTimeOffset Timestamp { get; set; }

    [JsonPropertyName("temperature")]
    public double Temperature { get; set; }

    [JsonPropertyName("humidity")]
    public int Humidity { get; set; }

    [JsonPropertyName("battery")]
    public int? Battery { get; set; }
}

public sealed class MeterHistoryResponse
{
    [JsonPropertyName("device_id")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("time_scale")]
    public string TimeScale { get; set; } = string.Empty;

    [JsonPropertyName("history")]
    public List<MeterReading> History { get; set; } = new();

    [JsonPropertyName("device")]
    public Meter? Device { get; set; }
}

public sealed class BackendStatus
{
    [JsonPropertyName("configured")]
    public bool Configured { get; set; }

    [JsonPropertyName("meters_count")]
    public int MetersCount { get; set; }

    [JsonPropertyName("is_rate_limited")]
    public bool IsRateLimited { get; set; }

    [JsonPropertyName("backoff_remaining")]
    public int BackoffRemaining { get; set; }

    [JsonPropertyName("last_api_call")]
    public double LastApiCall { get; set; }

    [JsonPropertyName("collection_interval")]
    public int CollectionInterval { get; set; }
}

public enum TimeScale
{
    Hour,
    Day,
    Week,
    Month,
    Year,
}

public static class TimeScaleExtensions
{
    public static string ToApiValue(this TimeScale scale) => scale switch
    {
        TimeScale.Hour => "hour",
        TimeScale.Day => "day",
        TimeScale.Week => "week",
        TimeScale.Month => "month",
        TimeScale.Year => "year",
        _ => "hour",
    };

    public static string ToLabel(this TimeScale scale) => scale switch
    {
        TimeScale.Hour => "直近 1 時間",
        TimeScale.Day => "直近 24 時間",
        TimeScale.Week => "直近 7 日間",
        TimeScale.Month => "直近 30 日間",
        TimeScale.Year => "直近 1 年間",
        _ => scale.ToString(),
    };
}
