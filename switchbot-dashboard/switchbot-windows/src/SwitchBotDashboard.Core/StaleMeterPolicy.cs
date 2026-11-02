using SwitchBotDashboard.Core.Models;

namespace SwitchBotDashboard.Core;

public static class StaleMeterPolicy
{
    public static readonly TimeSpan Threshold = TimeSpan.FromDays(7);

    public static bool IsStale(Meter meter, TimeProvider timeProvider)
    {
        ArgumentNullException.ThrowIfNull(meter);
        ArgumentNullException.ThrowIfNull(timeProvider);
        return IsStale(meter.LastUpdated, timeProvider.GetUtcNow());
    }

    public static bool IsStale(DateTimeOffset? lastUpdated, DateTimeOffset now) =>
        lastUpdated is null || now - lastUpdated.Value >= Threshold;
}
