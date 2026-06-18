using TempMaster.App.Models;
using TempMaster.App.Services;

namespace TempMaster.Tests;

public class SettingsAndModelTests
{
    [Fact]
    public void EffectiveRefreshSeconds_EnforcesMinimum()
    {
        var settings = new AppSettings { RefreshSeconds = 1 };
        Assert.Equal(AppSettings.MinRefreshSeconds, settings.EffectiveRefreshSeconds);
    }

    [Fact]
    public void EffectiveRefreshSeconds_KeepsLargerValues()
    {
        var settings = new AppSettings { RefreshSeconds = 60 };
        Assert.Equal(60, settings.EffectiveRefreshSeconds);
    }

    [Fact]
    public void DefaultBaseUrl_IsProduction()
    {
        Assert.Equal("https://temp-master.fly.dev", new AppSettings().BaseUrl);
    }

    [Theory]
    [InlineData(TimeScale.Hour, "hour")]
    [InlineData(TimeScale.Day, "day")]
    [InlineData(TimeScale.Week, "week")]
    [InlineData(TimeScale.Month, "month")]
    [InlineData(TimeScale.Year, "year")]
    public void TimeScale_ToApiValue(TimeScale scale, string expected)
    {
        Assert.Equal(expected, scale.ToApiValue());
    }
}
