using System.Text.Json.Serialization;

namespace SwitchBotDashboard.Core.Models;

public sealed record MetersResponse
{
    [JsonPropertyName("meters")]
    public IReadOnlyList<Meter> Meters { get; init; } = [];

    [JsonPropertyName("last_updated")]
    [JsonConverter(typeof(NullableDateTimeOffsetJsonConverter))]
    public DateTimeOffset? LastUpdated { get; init; }
}
