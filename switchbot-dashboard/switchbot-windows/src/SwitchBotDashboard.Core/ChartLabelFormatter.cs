using System.Globalization;

namespace SwitchBotDashboard.Core;

public static class ChartLabelFormatter
{
    public static string Format(DateTimeOffset timestamp, TimeScale timeScale)
    {
        var format = timeScale switch
        {
            TimeScale.Hour or TimeScale.Day => "HH:mm",
            TimeScale.Week => "ddd HH",
            TimeScale.Month or TimeScale.Year => "MMM d",
            _ => throw new ArgumentOutOfRangeException(nameof(timeScale), timeScale, null),
        };

        return timestamp.ToLocalTime().ToString(format, CultureInfo.InvariantCulture);
    }
}
