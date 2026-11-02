using System.Text.Json.Serialization;

namespace SwitchBotDashboard.Core.Models;

public sealed record HistoryResponse
{
    [JsonPropertyName("device_id")]
    public string DeviceId { get; init; } = string.Empty;

    [JsonPropertyName("time_scale")]
    public string TimeScale { get; init; } = string.Empty;

    [JsonPropertyName("history")]
    public IReadOnlyList<MeterReading> History { get; init; } = [];

    [JsonPropertyName("device")]
    public Meter? Device { get; init; }
}
