namespace TempMaster.App.Services;

public enum MeterSeverity
{
    Unknown,
    Normal,
    Warning,
    Critical,
}

/// <summary>
/// Classifies a meter's current temperature into an operational severity band.
/// Thresholds approximate a chemical-plant monitoring context where both very
/// low and very high process temperatures are abnormal.
/// </summary>
public static class MeterStatusEvaluator
{
    public const double WarningLow = 10.0;
    public const double WarningHigh = 30.0;
    public const double CriticalLow = 5.0;
    public const double CriticalHigh = 35.0;

    public static MeterSeverity Evaluate(double? temperature)
    {
        if (temperature is not double t)
        {
            return MeterSeverity.Unknown;
        }

        if (t <= CriticalLow || t >= CriticalHigh)
        {
            return MeterSeverity.Critical;
        }

        if (t <= WarningLow || t >= WarningHigh)
        {
            return MeterSeverity.Warning;
        }

        return MeterSeverity.Normal;
    }

    public static string ToLabel(MeterSeverity severity) => severity switch
    {
        MeterSeverity.Normal => "正常",
        MeterSeverity.Warning => "注意",
        MeterSeverity.Critical => "警報",
        _ => "データなし",
    };

    public static bool IsBatteryLow(int? battery) => battery is int b && b <= 20;
}
