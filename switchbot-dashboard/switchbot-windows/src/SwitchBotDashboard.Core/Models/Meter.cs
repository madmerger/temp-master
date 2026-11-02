using System.Text.Json.Serialization;

namespace SwitchBotDashboard.Core.Models;

public sealed record Meter
{
    [JsonPropertyName("device_id")]
    public string DeviceId { get; init; } = string.Empty;

    [JsonPropertyName("device_name")]
    public string DeviceName { get; init; } = string.Empty;

    [JsonPropertyName("device_type")]
    public string DeviceType { get; init; } = string.Empty;

    [JsonPropertyName("hub_device_id")]
    public string? HubDeviceId { get; init; }

    [JsonPropertyName("current_temperature")]
    public double? CurrentTemperature { get; init; }

    [JsonPropertyName("current_humidity")]
    public int? CurrentHumidity { get; init; }

    [JsonPropertyName("battery")]
    public int? Battery { get; init; }

    [JsonPropertyName("last_updated")]
    [JsonConverter(typeof(NullableDateTimeOffsetJsonConverter))]
    public DateTimeOffset? LastUpdated { get; init; }
}
