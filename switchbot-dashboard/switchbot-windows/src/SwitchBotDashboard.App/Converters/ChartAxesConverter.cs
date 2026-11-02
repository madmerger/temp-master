using System.Globalization;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore.SkiaSharpView.Painting;
using Microsoft.UI.Xaml.Data;
using SkiaSharp;

namespace SwitchBotDashboard.App.Converters;

public sealed class ChartAxesConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language) =>
        value is IReadOnlyList<string> labels
            ? CreateXAxes(labels, isDark: false)
            : Array.Empty<Axis>();

    public object ConvertBack(object value, Type targetType, object parameter, string language) =>
        throw new NotSupportedException();

    public static Axis[] CreateXAxes(IReadOnlyList<string> labels, bool isDark) =>
    [
        new Axis
        {
            Labels = labels,
            LabelsPaint = new SolidColorPaint(isDark ? SKColors.LightGray : SKColors.DimGray),
            TextSize = 11,
            MinStep = 1,
        },
    ];

    public static Axis[] CreateYAxes(bool isDark) =>
    [
        new Axis
        {
            LabelsPaint = new SolidColorPaint(isDark ? SKColors.LightGray : SKColors.DimGray),
            TextSize = 11,
            MinStep = 1,
            Labeler = value => Math.Round(value).ToString("0", CultureInfo.InvariantCulture),
        },
    ];
}
