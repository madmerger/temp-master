using System.Collections.Generic;
using TempMaster.App.Charting;

namespace TempMaster.Tests;

public class ChartGeometryTests
{
    [Fact]
    public void Build_EmptyReturnsNoPoints()
    {
        var series = ChartGeometry.Build(new List<double>(), 100, 50);
        Assert.Empty(series.Points);
    }

    [Fact]
    public void Build_SpreadsPointsAcrossWidth()
    {
        var series = ChartGeometry.Build(new List<double> { 0, 5, 10 }, 100, 50, padding: 0);

        Assert.Equal(3, series.Points.Count);
        Assert.Equal(0, series.Points[0].X, 3);
        Assert.Equal(50, series.Points[1].X, 3);
        Assert.Equal(100, series.Points[2].X, 3);
    }

    [Fact]
    public void Build_InvertsYSoMaxIsAtTop()
    {
        var series = ChartGeometry.Build(new List<double> { 0, 10 }, 100, 100, padding: 0);

        // Lowest value -> bottom (largest Y); highest value -> top (smallest Y).
        Assert.True(series.Points[0].Y > series.Points[1].Y);
        Assert.Equal(0, series.MinValue, 3);
        Assert.Equal(10, series.MaxValue, 3);
    }

    [Fact]
    public void Build_FlatSeriesCentersAndPadsRange()
    {
        var series = ChartGeometry.Build(new List<double> { 20, 20, 20 }, 100, 100, padding: 0);

        Assert.True(series.MaxValue > series.MinValue);
        foreach (var p in series.Points)
        {
            Assert.Equal(50, p.Y, 1);
        }
    }

    [Fact]
    public void Build_SinglePointCentersHorizontally()
    {
        var series = ChartGeometry.Build(new List<double> { 7 }, 80, 40, padding: 0);
        Assert.Single(series.Points);
        Assert.Equal(40, series.Points[0].X, 3);
    }
}
