using System.Globalization;
using CommunityToolkit.Mvvm.ComponentModel;
using SwitchBotDashboard.Core.Models;

namespace SwitchBotDashboard.Core;

public sealed class MeterCardViewModel : ObservableObject
{
    private IReadOnlyList<ChartPoint> _points = [];
    private IReadOnlyList<string> _labels = [];

    public MeterCardViewModel(Meter meter, string displayName, bool isStale)
    {
        DeviceId = meter.DeviceId;
        DisplayName = displayName;
        DeviceType = meter.DeviceType;
        TemperatureText = meter.CurrentTemperature is { } temperature
            ? $"{temperature.ToString("0.0", CultureInfo.InvariantCulture)}°C"
            : null;
        HumidityText = meter.CurrentHumidity is { } humidity ? $"{humidity}%" : null;
        BatteryText = meter.Battery is { } battery ? $"{battery}%" : null;
        LastUpdatedText = meter.LastUpdated is { } lastUpdated
            ? $"Last updated: {lastUpdated.ToLocalTime().ToString("g", CultureInfo.CurrentCulture)}"
            : null;
        IsStale = isStale;
        HasValues = meter.CurrentTemperature is not null
            || meter.CurrentHumidity is not null
            || meter.Battery is not null;
    }

    public string DeviceId { get; }

    public string AutomationId => $"MeterCard_{DeviceId}";

    public string NameAutomationId => $"MeterName_{DeviceId}";

    public string DisplayName { get; }

    public string DeviceType { get; }

    public string? TemperatureText { get; }

    public string? HumidityText { get; }

    public string? BatteryText { get; }

    public string? LastUpdatedText { get; }

    public bool IsStale { get; }

    public bool HasValues { get; }

    public IReadOnlyList<ChartPoint> Points
    {
        get => _points;
        private set => SetProperty(ref _points, value);
    }

    public IReadOnlyList<string> Labels
    {
        get => _labels;
        private set => SetProperty(ref _labels, value);
    }

    internal void SetHistory(IEnumerable<MeterReading> readings, TimeScale timeScale)
    {
        var points = readings
            .OrderBy(reading => reading.Timestamp)
            .Select(reading => new ChartPoint(reading.Timestamp, reading.Temperature))
            .ToArray();
        Points = points;
        Labels = points.Select(point => ChartLabelFormatter.Format(point.Time, timeScale)).ToArray();
    }
}
