using Xunit;

namespace SwitchBotDashboard.UITests;

[AttributeUsage(AttributeTargets.Method)]
public sealed class WindowsFactAttribute : FactAttribute
{
    public WindowsFactAttribute()
    {
        if (!OperatingSystem.IsWindows())
        {
            Skip = "WinUI UI automation requires Windows.";
        }
    }
}
