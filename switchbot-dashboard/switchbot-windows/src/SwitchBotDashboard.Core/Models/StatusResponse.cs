using System.Text.Json.Serialization;

namespace SwitchBotDashboard.Core.Models;

public sealed record StatusResponse
{
    [JsonPropertyName("configured")]
    public bool Configured { get; init; }

    [JsonPropertyName("meters_count")]
    public int MetersCount { get; init; }

    [JsonPropertyName("is_rate_limited")]
    public bool IsRateLimited { get; init; }

    [JsonPropertyName("backoff_remaining")]
    public int BackoffRemaining { get; init; }

    [JsonPropertyName("last_api_call")]
    public double LastApiCall { get; init; }

    [JsonPropertyName("collection_interval")]
    public int CollectionInterval { get; init; }
}
