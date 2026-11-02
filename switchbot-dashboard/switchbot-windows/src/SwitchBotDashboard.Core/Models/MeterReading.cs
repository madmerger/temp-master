using System.Text.Json.Serialization;

namespace SwitchBotDashboard.Core.Models;

public sealed record MeterReading
{
    [JsonPropertyName("timestamp")]
    public DateTimeOffset Timestamp { get; init; }

    [JsonPropertyName("temperature")]
    public double Temperature { get; init; }

    [JsonPropertyName("humidity")]
    public int Humidity { get; init; }

    [JsonPropertyName("battery")]
    public int? Battery { get; init; }
}
