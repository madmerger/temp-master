using System;
using System.Collections.Generic;
using System.Linq;
using TempMaster.App.Models;

namespace TempMaster.App.Charting;

public readonly record struct ChartPoint(double X, double Y);

public sealed class ChartSeries
{
    public IReadOnlyList<ChartPoint> Points { get; init; } = Array.Empty<ChartPoint>();
    public double MinValue { get; init; }
    public double MaxValue { get; init; }
}

/// <summary>
/// Pure (UI-independent) helpers that convert a sequence of readings into pixel
/// coordinates for a line chart. Kept separate from WPF so it can be unit tested.
/// </summary>
public static class ChartGeometry
{
    /// <summary>
    /// Projects the supplied values onto a chart of the given pixel size.
    /// X is spread evenly across the width; Y is inverted (0 = top) and padded
    /// so a flat series still renders mid-height.
    /// </summary>
    public static ChartSeries Build(IReadOnlyList<double> values, double width, double height, double padding = 6)
    {
        if (values is null || values.Count == 0 || width <= 0 || height <= 0)
        {
            return new ChartSeries();
        }

        double min = values.Min();
        double max = values.Max();

        double range = max - min;
        if (range < 1e-9)
        {
            // Flat line: center it and give a synthetic range for axis labels.
            min -= 0.5;
            max += 0.5;
            range = max - min;
        }

        double usableHeight = Math.Max(1, height - (padding * 2));
        double usableWidth = Math.Max(1, width - (padding * 2));

        var points = new List<ChartPoint>(values.Count);
        for (int i = 0; i < values.Count; i++)
        {
            double xFraction = values.Count == 1 ? 0.5 : (double)i / (values.Count - 1);
            double x = padding + (xFraction * usableWidth);

            double yFraction = (values[i] - min) / range;
            double y = padding + ((1 - yFraction) * usableHeight);
            points.Add(new ChartPoint(x, y));
        }

        return new ChartSeries
        {
            Points = points,
            MinValue = min,
            MaxValue = max,
        };
    }

    public static ChartSeries BuildTemperature(IReadOnlyList<MeterReading> readings, double width, double height, double padding = 6)
        => Build(readings.Select(r => r.Temperature).ToList(), width, height, padding);
}
