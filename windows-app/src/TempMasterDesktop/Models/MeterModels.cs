using System.Text.Json.Serialization;

namespace TempMasterDesktop.Models;

public class MeterDevice
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
    public string? LastUpdated { get; set; }

    public string DisplayName => DisplayNames.GetDisplayName(DeviceName);
}

public class MeterReading
{
    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = string.Empty;

    [JsonPropertyName("temperature")]
    public double Temperature { get; set; }

    [JsonPropertyName("humidity")]
    public int Humidity { get; set; }

    [JsonPropertyName("battery")]
    public int? Battery { get; set; }
}

public class MetersResponse
{
    [JsonPropertyName("meters")]
    public List<MeterDevice> Meters { get; set; } = new();
}

public class HistoryResponse
{
    [JsonPropertyName("device_id")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("history")]
    public List<MeterReading> History { get; set; } = new();
}

public class StatusResponse
{
    [JsonPropertyName("configured")]
    public bool Configured { get; set; }

    [JsonPropertyName("meters_count")]
    public int MetersCount { get; set; }

    [JsonPropertyName("is_collecting")]
    public bool IsCollecting { get; set; }

    [JsonPropertyName("rate_limited")]
    public bool RateLimited { get; set; }
}

public static class DisplayNames
{
    private static readonly Dictionary<string, string> Names = new()
    {
        ["Bedroom Meter"] = "第蒸塔(T-101)",
        ["Living Meter"] = "第蒸塔(T-102)",
        ["Hub 2"] = "反応器(R-201)",
    };

    public static string GetDisplayName(string deviceName)
    {
        return Names.TryGetValue(deviceName, out var display) ? display : deviceName;
    }
}
