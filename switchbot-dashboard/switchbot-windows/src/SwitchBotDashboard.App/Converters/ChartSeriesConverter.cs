using System.Globalization;
using LiveChartsCore;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore.SkiaSharpView.Painting;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Data;
using SkiaSharp;
using SwitchBotDashboard.Core;

namespace SwitchBotDashboard.App.Converters;

public sealed class ChartSeriesConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language) =>
        value is IReadOnlyList<ChartPoint> points
            ? Create(points, isDark: false)
            : Array.Empty<ISeries>();

    public object ConvertBack(object value, Type targetType, object parameter, string language) =>
        throw new NotSupportedException();

    public static ISeries[] Create(IReadOnlyList<ChartPoint> points, bool isDark)
    {
        var accent = new SKColor(217, 83, 79);
        return
        [
            new LineSeries<double>
            {
                Values = points.Select(point => point.Temperature).ToArray(),
                GeometrySize = 0,
                Stroke = new SolidColorPaint(accent, 2),
                Fill = new SolidColorPaint(accent.WithAlpha(isDark ? (byte)90 : (byte)45)),
                YToolTipLabelFormatter = point =>
                    $"{point.Coordinate.PrimaryValue.ToString("0.0", CultureInfo.InvariantCulture)}°C",
            },
        ];
    }
}
