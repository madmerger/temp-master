using System.Collections.Generic;
using System.Windows.Media;
using TempMaster.App.Models;
using TempMaster.App.Services;

namespace TempMaster.App.ViewModels;

public sealed class MeterViewModel : ObservableObject
{
    private Meter _meter;
    private IReadOnlyList<MeterReading> _history = new List<MeterReading>();

    public MeterViewModel(Meter meter)
    {
        _meter = meter;
    }

    public string DeviceId => _meter.DeviceId;

    public string DisplayName => DisplayNameMapper.Resolve(_meter.DeviceName);

    public string RawName => _meter.DeviceName;

    public string DeviceType => _meter.DeviceType;

    public string TemperatureText => _meter.CurrentTemperature is double t ? $"{t:0.0}°C" : "--";

    public string HumidityText => _meter.CurrentHumidity is int h ? $"{h}%" : "--";

    public string BatteryText => _meter.Battery is int b ? $"{b}%" : "--";

    public bool BatteryLow => MeterStatusEvaluator.IsBatteryLow(_meter.Battery);

    public string LastUpdatedText => _meter.LastUpdated is DateTimeOffset d
        ? $"最終更新: {d.ToLocalTime():yyyy/MM/dd HH:mm:ss}"
        : "最終更新: --";

    public MeterSeverity Severity => MeterStatusEvaluator.Evaluate(_meter.CurrentTemperature);

    public string SeverityLabel => MeterStatusEvaluator.ToLabel(Severity);

    public Brush SeverityBrush => Severity switch
    {
        MeterSeverity.Normal => new SolidColorBrush(Color.FromRgb(0x2E, 0xCC, 0x71)),
        MeterSeverity.Warning => new SolidColorBrush(Color.FromRgb(0xF3, 0x9C, 0x12)),
        MeterSeverity.Critical => new SolidColorBrush(Color.FromRgb(0xE7, 0x4C, 0x3C)),
        _ => new SolidColorBrush(Color.FromRgb(0x7F, 0x8C, 0x8D)),
    };

    public IReadOnlyList<MeterReading> History
    {
        get => _history;
        private set => SetProperty(ref _history, value);
    }

    public void UpdateFrom(Meter meter)
    {
        _meter = meter;
        RaiseAll();
    }

    public void SetHistory(IReadOnlyList<MeterReading> history)
    {
        History = history;
    }

    private void RaiseAll()
    {
        OnPropertyChanged(nameof(DisplayName));
        OnPropertyChanged(nameof(RawName));
        OnPropertyChanged(nameof(DeviceType));
        OnPropertyChanged(nameof(TemperatureText));
        OnPropertyChanged(nameof(HumidityText));
        OnPropertyChanged(nameof(BatteryText));
        OnPropertyChanged(nameof(BatteryLow));
        OnPropertyChanged(nameof(LastUpdatedText));
        OnPropertyChanged(nameof(Severity));
        OnPropertyChanged(nameof(SeverityLabel));
        OnPropertyChanged(nameof(SeverityBrush));
    }
}
