using Xunit;

namespace SwitchBotDashboard.Core.Tests;

public sealed class MockDashboardApiTests
{
    [Fact]
    public async Task MockMatchesSharedScenarioAndReturnsDistinctTwelvePointRanges()
    {
        var api = new MockDashboardApi();
        var meters = await api.GetMetersAsync();
        var status = await api.GetStatusAsync();

        Assert.Equal(MockDashboardApi.ScenarioNow, meters.LastUpdated);
        Assert.Equal(6, meters.Meters.Count);
        Assert.Equal(4, MockDashboardApi.ActiveDeviceIds.Length);
        Assert.Equal(2, MockDashboardApi.StaleDeviceIds.Length);
        Assert.True(status.Configured);
        Assert.Equal(6, status.MetersCount);
        Assert.False(status.IsRateLimited);
        Assert.Equal(120, status.CollectionInterval);

        var histories = new List<double[]>();
        foreach (var timeScale in Enum.GetValues<TimeScale>())
        {
            var response = await api.GetHistoryAsync(MockDashboardApi.ActiveDeviceIds[0], timeScale);
            Assert.Equal(timeScale.ToApiValue(), response.TimeScale);
            Assert.Equal(12, response.History.Count);
            histories.Add(response.History.Select(reading => reading.Temperature).ToArray());
        }

        for (var left = 0; left < histories.Count; left++)
        {
            for (var right = left + 1; right < histories.Count; right++)
            {
                Assert.False(histories[left].SequenceEqual(histories[right]));
            }
        }
    }
}
