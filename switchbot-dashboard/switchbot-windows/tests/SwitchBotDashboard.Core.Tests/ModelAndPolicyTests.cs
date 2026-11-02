using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Time.Testing;
using SwitchBotDashboard.Core.Models;
using Xunit;

namespace SwitchBotDashboard.Core.Tests;

public sealed class ModelAndPolicyTests
{
    [Fact]
    public void RealApiSamplesDeserializeAndIgnoreUnknownFields()
    {
        var meters = JsonSerializer.Deserialize<MetersResponse>(TestResources.Read("meters.sample.json"));
        var history = JsonSerializer.Deserialize<HistoryResponse>(TestResources.Read("history.sample.json"));

        Assert.NotNull(meters);
        Assert.Single(meters.Meters);
        Assert.Equal("F577B677EC96", meters.Meters[0].DeviceId);
        Assert.Equal(24.1, meters.Meters[0].CurrentTemperature);
        Assert.Equal(
            8_829_080L,
            meters.Meters[0].LastUpdated!.Value.Ticks % TimeSpan.TicksPerSecond);

        Assert.NotNull(history);
        Assert.Equal("hour", history.TimeScale);
        Assert.Equal(2, history.History.Count);
        Assert.Equal(24.6, history.History[0].Temperature);
        Assert.Equal(100, history.History[0].Battery);
        Assert.NotNull(history.Device);
    }

    [Fact]
    public void StatusResponseIgnoresFutureFields()
    {
        var status = JsonSerializer.Deserialize<StatusResponse>(
            """{"configured":true,"meters_count":6,"is_rate_limited":true,"backoff_remaining":17,"last_api_call":1762074000,"collection_interval":120,"future_field":"ignored"}""");

        Assert.NotNull(status);
        Assert.True(status.Configured);
        Assert.Equal(6, status.MetersCount);
        Assert.True(status.IsRateLimited);
        Assert.Equal(17, status.BackoffRemaining);
    }

    [Theory]
    [InlineData("2026-02-09T02:13:39.882908+00:00", 8829080)]
    [InlineData("2026-02-09T02:13:39+00:00", 0)]
    [InlineData("2026-02-09T02:13:39Z", 0)]
    public void MeterTimestampsAcceptIsoVariants(string timestamp, long fractionalTicks)
    {
        var meter = JsonSerializer.Deserialize<Meter>(
            $$"""{"device_id":"sample","last_updated":"{{timestamp}}"}""");

        Assert.NotNull(meter);
        Assert.Equal(fractionalTicks, meter.LastUpdated!.Value.Ticks % TimeSpan.TicksPerSecond);
    }

    [Fact]
    public void InvalidOptionalLastUpdatedIsTreatedAsNull()
    {
        var meter = JsonSerializer.Deserialize<Meter>(
            """{"device_id":"sample","last_updated":"not-a-timestamp"}""");

        Assert.NotNull(meter);
        Assert.Null(meter.LastUpdated);
        Assert.True(StaleMeterPolicy.IsStale(meter.LastUpdated, DateTimeOffset.UtcNow));
    }

    [Fact]
    public void DisplayNamesContainAllSharedAliasesAndPassUnknownNamesThrough()
    {
        var map = new DisplayNameMap();
        using var stream = typeof(DisplayNameMap).Assembly.GetManifestResourceStream("display_names.json");

        Assert.NotNull(stream);
        var names = JsonSerializer.Deserialize<Dictionary<string, string>>(stream);
        Assert.NotNull(names);
        Assert.Equal(23, names.Count);
        Assert.Equal("第1蒸留塔 (T-101)", map.Resolve("Bedroom Meter"));
        Assert.Equal("冷却塔 (CT-401)", map.Resolve("アワコ"));
        Assert.Equal("Unmapped Sensor", map.Resolve("Unmapped Sensor"));
    }

    [Fact]
    public void StaleThresholdIncludesExactlySevenDays()
    {
        var now = new DateTimeOffset(2026, 11, 2, 9, 0, 0, TimeSpan.Zero);
        var timeProvider = new FakeTimeProvider(now);

        Assert.True(StaleMeterPolicy.IsStale(new Meter { LastUpdated = now - TimeSpan.FromDays(7) }, timeProvider));
        Assert.False(StaleMeterPolicy.IsStale(
            new Meter { LastUpdated = now - TimeSpan.FromDays(7) + TimeSpan.FromSeconds(1) },
            timeProvider));
        Assert.True(StaleMeterPolicy.IsStale(new Meter { LastUpdated = null }, timeProvider));
    }

    [Theory]
    [InlineData(TimeScale.Hour, "HH:mm")]
    [InlineData(TimeScale.Day, "HH:mm")]
    [InlineData(TimeScale.Week, "ddd HH")]
    [InlineData(TimeScale.Month, "MMM d")]
    [InlineData(TimeScale.Year, "MMM d")]
    public void ChartLabelsUseRangeFormatAndLocalTime(TimeScale timeScale, string format)
    {
        var timestamp = new DateTimeOffset(2026, 1, 1, 15, 45, 0, TimeSpan.Zero);

        Assert.Equal(
            timestamp.ToLocalTime().ToString(format, CultureInfo.InvariantCulture),
            ChartLabelFormatter.Format(timestamp, timeScale));
    }

    [Theory]
    [InlineData(TimeScale.Hour, "hour", "Last Hour")]
    [InlineData(TimeScale.Day, "day", "Last 24 Hours")]
    [InlineData(TimeScale.Week, "week", "Last 7 Days")]
    [InlineData(TimeScale.Month, "month", "Last 30 Days")]
    [InlineData(TimeScale.Year, "year", "Last Year")]
    public void TimeScaleMapsApiAndDisplayValues(TimeScale timeScale, string apiValue, string label)
    {
        Assert.Equal(apiValue, timeScale.ToApiValue());
        Assert.Equal(label, timeScale.DisplayLabel());
    }
}
