namespace SwitchBotDashboard.Core;

public enum TimeScale
{
    Hour,
    Day,
    Week,
    Month,
    Year,
}

public static class TimeScaleExtensions
{
    public static string ToApiValue(this TimeScale timeScale) =>
        timeScale switch
        {
            TimeScale.Hour => "hour",
            TimeScale.Day => "day",
            TimeScale.Week => "week",
            TimeScale.Month => "month",
            TimeScale.Year => "year",
            _ => throw new ArgumentOutOfRangeException(nameof(timeScale), timeScale, null),
        };

    public static string DisplayLabel(this TimeScale timeScale) =>
        timeScale switch
        {
            TimeScale.Hour => "Last Hour",
            TimeScale.Day => "Last 24 Hours",
            TimeScale.Week => "Last 7 Days",
            TimeScale.Month => "Last 30 Days",
            TimeScale.Year => "Last Year",
            _ => throw new ArgumentOutOfRangeException(nameof(timeScale), timeScale, null),
        };
}
