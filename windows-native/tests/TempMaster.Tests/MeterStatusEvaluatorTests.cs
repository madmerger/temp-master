using TempMaster.App.Services;

namespace TempMaster.Tests;

public class MeterStatusEvaluatorTests
{
    [Theory]
    [InlineData(22.0, MeterSeverity.Normal)]
    [InlineData(10.0, MeterSeverity.Warning)]
    [InlineData(31.0, MeterSeverity.Warning)]
    [InlineData(4.0, MeterSeverity.Critical)]
    [InlineData(40.0, MeterSeverity.Critical)]
    public void Evaluate_ClassifiesTemperature(double temp, MeterSeverity expected)
    {
        Assert.Equal(expected, MeterStatusEvaluator.Evaluate(temp));
    }

    [Fact]
    public void Evaluate_NullIsUnknown()
    {
        Assert.Equal(MeterSeverity.Unknown, MeterStatusEvaluator.Evaluate(null));
    }

    [Theory]
    [InlineData(20, true)]
    [InlineData(21, false)]
    [InlineData(null, false)]
    public void IsBatteryLow_Threshold(int? battery, bool expected)
    {
        Assert.Equal(expected, MeterStatusEvaluator.IsBatteryLow(battery));
    }
}
