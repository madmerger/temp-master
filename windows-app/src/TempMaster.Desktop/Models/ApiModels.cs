using System.Text.Json.Serialization;

namespace TempMaster.Desktop.Models;

/// <summary>A single SwitchBot meter device, mirrors the backend MeterDevice model.</summary>
public sealed class MeterDevice
{
    [JsonPropertyName("device_id")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("device_name")]
    public string DeviceName { get; set; } = string.Empty;

    [JsonPropertyName("device_type")]
    public string DeviceType { get; set; } = string.Empty;

    [JsonPropertyName("current_temperature")]
    public double? CurrentTemperature { get; set; }

    [JsonPropertyName("current_humidity")]
    public int? CurrentHumidity { get; set; }

    [JsonPropertyName("battery")]
    public int? Battery { get; set; }

    [JsonPropertyName("last_updated")]
    public DateTime? LastUpdated { get; set; }
}

public sealed class MetersResponse
{
    [JsonPropertyName("meters")]
    public List<MeterDevice> Meters { get; set; } = new();

    [JsonPropertyName("last_updated")]
    public DateTime? LastUpdated { get; set; }
}

public sealed class MeterReading
{
    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }

    [JsonPropertyName("temperature")]
    public double Temperature { get; set; }

    [JsonPropertyName("humidity")]
    public int Humidity { get; set; }

    [JsonPropertyName("battery")]
    public int? Battery { get; set; }
}

public sealed class HistoryResponse
{
    [JsonPropertyName("device_id")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("time_scale")]
    public string TimeScale { get; set; } = string.Empty;

    [JsonPropertyName("history")]
    public List<MeterReading> History { get; set; } = new();
}

public sealed class StatusResponse
{
    [JsonPropertyName("configured")]
    public bool Configured { get; set; }

    [JsonPropertyName("meters_count")]
    public int MetersCount { get; set; }

    [JsonPropertyName("is_rate_limited")]
    public bool IsRateLimited { get; set; }

    [JsonPropertyName("backoff_remaining")]
    public int BackoffRemaining { get; set; }

    [JsonPropertyName("collection_interval")]
    public int CollectionInterval { get; set; }
}
