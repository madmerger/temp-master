using LiveChartsCore.SkiaSharpView;
using Microsoft.UI.Xaml.Data;

namespace SwitchBotDashboard.App.Converters;

public sealed class ChartYAxisConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language) =>
        ChartAxesConverter.CreateYAxes(isDark: false);

    public object ConvertBack(object value, Type targetType, object parameter, string language) =>
        throw new NotSupportedException();
}
