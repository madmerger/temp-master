using System.Text.Json.Serialization;

namespace SwitchBotDashboard.Core.Models;

public sealed record RefreshResponse
{
    [JsonPropertyName("status")]
    public string Status { get; init; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; init; } = string.Empty;

    [JsonPropertyName("meters_count")]
    public int MetersCount { get; init; }
}
