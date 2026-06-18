using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Windows;
using System.Windows.Media;
using TempMaster.App.Charting;
using TempMaster.App.Models;

namespace TempMaster.App.Controls;

/// <summary>
/// Lightweight temperature line chart rendered with <see cref="DrawingContext"/>.
/// Avoids third-party charting dependencies. Plots the temperature series from
/// the bound readings and annotates min/max values.
/// </summary>
public sealed class LineChart : FrameworkElement
{
    public static readonly DependencyProperty ReadingsProperty = DependencyProperty.Register(
        nameof(Readings),
        typeof(IReadOnlyList<MeterReading>),
        typeof(LineChart),
        new FrameworkPropertyMetadata(null, FrameworkPropertyMetadataOptions.AffectsRender));

    public static readonly DependencyProperty LineBrushProperty = DependencyProperty.Register(
        nameof(LineBrush),
        typeof(Brush),
        typeof(LineChart),
        new FrameworkPropertyMetadata(new SolidColorBrush(Color.FromRgb(0x3D, 0x9B, 0xE9)), FrameworkPropertyMetadataOptions.AffectsRender));

    public IReadOnlyList<MeterReading>? Readings
    {
        get => (IReadOnlyList<MeterReading>?)GetValue(ReadingsProperty);
        set => SetValue(ReadingsProperty, value);
    }

    public Brush LineBrush
    {
        get => (Brush)GetValue(LineBrushProperty);
        set => SetValue(LineBrushProperty, value);
    }

    protected override void OnRender(DrawingContext dc)
    {
        base.OnRender(dc);

        double w = ActualWidth;
        double h = ActualHeight;
        if (w <= 0 || h <= 0)
        {
            return;
        }

        var background = new SolidColorBrush(Color.FromRgb(0x16, 0x1C, 0x24));
        dc.DrawRectangle(background, null, new Rect(0, 0, w, h));

        var readings = Readings;
        var typeface = new Typeface("Segoe UI");
        double dpi = VisualTreeHelper.GetDpi(this).PixelsPerDip;

        if (readings is null || readings.Count == 0)
        {
            DrawCenteredText(dc, "データがありません", typeface, dpi, w, h);
            return;
        }

        var series = ChartGeometry.BuildTemperature(readings, w, h);
        if (series.Points.Count == 0)
        {
            DrawCenteredText(dc, "データがありません", typeface, dpi, w, h);
            return;
        }

        DrawGridLines(dc, w, h);

        var lineBrush = LineBrush;
        var pen = new Pen(lineBrush, 2)
        {
            LineJoin = PenLineJoin.Round,
        };

        if (series.Points.Count == 1)
        {
            var p = series.Points[0];
            dc.DrawEllipse(lineBrush, null, new Point(p.X, p.Y), 3, 3);
        }
        else
        {
            var geometry = BuildGeometry(series.Points, w, h, out var fillGeometry);
            var fillBrush = new SolidColorBrush(((SolidColorBrush)lineBrush).Color) { Opacity = 0.18 };
            dc.DrawGeometry(fillBrush, null, fillGeometry);
            dc.DrawGeometry(null, pen, geometry);
        }

        DrawAxisLabels(dc, series, typeface, dpi, w, h);
    }

    private static StreamGeometry BuildGeometry(IReadOnlyList<ChartPoint> points, double w, double h, out StreamGeometry fillGeometry)
    {
        var line = new StreamGeometry();
        using (var ctx = line.Open())
        {
            ctx.BeginFigure(new Point(points[0].X, points[0].Y), isFilled: false, isClosed: false);
            ctx.PolyLineTo(points.Skip(1).Select(p => new Point(p.X, p.Y)).ToList(), isStroked: true, isSmoothJoin: true);
        }

        line.Freeze();

        fillGeometry = new StreamGeometry();
        using (var ctx = fillGeometry.Open())
        {
            ctx.BeginFigure(new Point(points[0].X, h), isFilled: true, isClosed: true);
            ctx.LineTo(new Point(points[0].X, points[0].Y), isStroked: false, isSmoothJoin: false);
            ctx.PolyLineTo(points.Skip(1).Select(p => new Point(p.X, p.Y)).ToList(), isStroked: false, isSmoothJoin: true);
            ctx.LineTo(new Point(points[^1].X, h), isStroked: false, isSmoothJoin: false);
        }

        fillGeometry.Freeze();
        return line;
    }

    private static void DrawGridLines(DrawingContext dc, double w, double h)
    {
        var gridPen = new Pen(new SolidColorBrush(Color.FromArgb(0x33, 0xFF, 0xFF, 0xFF)), 0.5);
        for (int i = 1; i < 4; i++)
        {
            double y = h * i / 4.0;
            dc.DrawLine(gridPen, new Point(0, y), new Point(w, y));
        }
    }

    private static void DrawAxisLabels(DrawingContext dc, ChartSeries series, Typeface typeface, double dpi, double w, double h)
    {
        var brush = new SolidColorBrush(Color.FromRgb(0xB0, 0xBA, 0xC5));
        var max = FormatText($"{series.MaxValue:0.0}°C", typeface, dpi, brush);
        var min = FormatText($"{series.MinValue:0.0}°C", typeface, dpi, brush);
        dc.DrawText(max, new Point(4, 2));
        dc.DrawText(min, new Point(4, h - min.Height - 2));
    }

    private static void DrawCenteredText(DrawingContext dc, string text, Typeface typeface, double dpi, double w, double h)
    {
        var brush = new SolidColorBrush(Color.FromRgb(0x7F, 0x8C, 0x8D));
        var ft = FormatText(text, typeface, dpi, brush);
        dc.DrawText(ft, new Point((w - ft.Width) / 2, (h - ft.Height) / 2));
    }

    private static FormattedText FormatText(string text, Typeface typeface, double dpi, Brush brush)
        => new(
            text,
            CultureInfo.CurrentCulture,
            FlowDirection.LeftToRight,
            typeface,
            11,
            brush,
            dpi);
}
