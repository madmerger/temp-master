using System.Globalization;
using System.Windows;
using System.Windows.Media;
using TempMaster.Desktop.Models;

namespace TempMaster.Desktop.Controls;

/// <summary>
/// Lightweight temperature line chart drawn directly with the WPF drawing
/// primitives. Mirrors the Chart.js line chart used by the web dashboard
/// (red line, soft fill, time-scaled x-axis labels, degree y-axis).
/// </summary>
public sealed class TemperatureChart : FrameworkElement
{
    private static readonly Brush LineBrush = new SolidColorBrush(Color.FromRgb(0xD9, 0x53, 0x4F));
    private static readonly Brush FillBrush = new SolidColorBrush(Color.FromArgb(0x26, 0xD9, 0x53, 0x4F));
    private static readonly Brush GridBrush = new SolidColorBrush(Color.FromArgb(0x14, 0x00, 0x00, 0x00));
    private static readonly Brush AxisTextBrush = new SolidColorBrush(Color.FromRgb(0x77, 0x77, 0x77));
    private static readonly Pen LinePen;
    private static readonly Pen GridPen;
    private static readonly Typeface AxisTypeface =
        new(new FontFamily("Segoe UI"), FontStyles.Normal, FontWeights.Normal, FontStretches.Normal);

    static TemperatureChart()
    {
        LinePen = new Pen(LineBrush, 2);
        LinePen.Freeze();
        GridPen = new Pen(GridBrush, 1);
        GridPen.Freeze();
        LineBrush.Freeze();
        FillBrush.Freeze();
        GridBrush.Freeze();
        AxisTextBrush.Freeze();
    }

    private List<MeterReading> _readings = new();
    private string _timeScale = "day";

    public void SetData(IEnumerable<MeterReading> readings, string timeScale)
    {
        _readings = readings.ToList();
        _timeScale = timeScale;
        InvalidateVisual();
    }

    protected override void OnRender(DrawingContext dc)
    {
        double width = ActualWidth;
        double height = ActualHeight;
        if (width <= 0 || height <= 0)
            return;

        // Background
        dc.DrawRectangle(Brushes.White, null, new Rect(0, 0, width, height));

        const double padLeft = 38;
        const double padRight = 10;
        const double padTop = 10;
        const double padBottom = 24;

        double plotW = width - padLeft - padRight;
        double plotH = height - padTop - padBottom;
        if (plotW <= 0 || plotH <= 0)
            return;

        if (_readings.Count == 0)
        {
            var noData = MakeText("No data", 12, AxisTextBrush);
            dc.DrawText(noData, new Point((width - noData.Width) / 2, (height - noData.Height) / 2));
            return;
        }

        double minTemp = _readings.Min(r => r.Temperature);
        double maxTemp = _readings.Max(r => r.Temperature);
        if (Math.Abs(maxTemp - minTemp) < 0.5)
        {
            minTemp -= 1;
            maxTemp += 1;
        }
        // Add a little headroom.
        double range = maxTemp - minTemp;
        minTemp -= range * 0.1;
        maxTemp += range * 0.1;
        range = maxTemp - minTemp;

        double X(int i) => _readings.Count == 1
            ? padLeft + plotW / 2
            : padLeft + plotW * i / (_readings.Count - 1);
        double Y(double t) => padTop + plotH * (1 - (t - minTemp) / range);

        // Horizontal grid lines + y-axis labels (4 ticks).
        const int yTicks = 4;
        for (int t = 0; t <= yTicks; t++)
        {
            double value = minTemp + range * t / yTicks;
            double y = Y(value);
            dc.DrawLine(GridPen, new Point(padLeft, y), new Point(width - padRight, y));
            var label = MakeText(value.ToString("0", CultureInfo.InvariantCulture) + "\u00b0", 10, AxisTextBrush);
            dc.DrawText(label, new Point(padLeft - label.Width - 5, y - label.Height / 2));
        }

        // X-axis labels (up to 6, evenly spaced).
        int maxLabels = Math.Min(6, _readings.Count);
        for (int l = 0; l < maxLabels; l++)
        {
            int idx = maxLabels == 1 ? 0 : (int)Math.Round((double)l * (_readings.Count - 1) / (maxLabels - 1));
            var label = MakeText(FormatTimestamp(_readings[idx].Timestamp, _timeScale), 10, AxisTextBrush);
            double x = X(idx) - label.Width / 2;
            x = Math.Max(0, Math.Min(width - label.Width, x));
            dc.DrawText(label, new Point(x, height - padBottom + 5));
        }

        // Build the line geometry.
        var lineFigure = new PathFigure { StartPoint = new Point(X(0), Y(_readings[0].Temperature)) };
        for (int i = 1; i < _readings.Count; i++)
            lineFigure.Segments.Add(new LineSegment(new Point(X(i), Y(_readings[i].Temperature)), true));

        // Fill area under the line.
        var fillFigure = new PathFigure { StartPoint = new Point(X(0), padTop + plotH) };
        fillFigure.Segments.Add(new LineSegment(new Point(X(0), Y(_readings[0].Temperature)), true));
        for (int i = 1; i < _readings.Count; i++)
            fillFigure.Segments.Add(new LineSegment(new Point(X(i), Y(_readings[i].Temperature)), true));
        fillFigure.Segments.Add(new LineSegment(new Point(X(_readings.Count - 1), padTop + plotH), true));
        fillFigure.IsClosed = true;

        var fillGeometry = new PathGeometry();
        fillGeometry.Figures.Add(fillFigure);
        dc.DrawGeometry(FillBrush, null, fillGeometry);

        var lineGeometry = new PathGeometry();
        lineGeometry.Figures.Add(lineFigure);
        dc.DrawGeometry(null, LinePen, lineGeometry);

        // Data points.
        for (int i = 0; i < _readings.Count; i++)
            dc.DrawEllipse(LineBrush, null, new Point(X(i), Y(_readings[i].Temperature)), 2.5, 2.5);
    }

    private FormattedText MakeText(string text, double size, Brush brush) => new(
        text,
        CultureInfo.InvariantCulture,
        FlowDirection.LeftToRight,
        AxisTypeface,
        size,
        brush,
        VisualTreeHelper.GetDpi(this).PixelsPerDip);

    private static readonly string[] Days = { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" };
    private static readonly string[] Months =
        { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };

    private static string FormatTimestamp(DateTime ts, string timeScale)
    {
        var local = ts.ToLocalTime();
        return timeScale switch
        {
            "hour" or "day" => local.ToString("HH:mm", CultureInfo.InvariantCulture),
            "week" => $"{Days[(int)local.DayOfWeek]} {local:HH}",
            "month" or "year" => $"{Months[local.Month - 1]} {local.Day}",
            _ => local.ToString(CultureInfo.InvariantCulture),
        };
    }
}
