using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Threading;
using TempMasterDesktop.Models;
using TempMasterDesktop.Services;

namespace TempMasterDesktop.ViewModels;

public class MainViewModel : INotifyPropertyChanged, IDisposable
{
    private readonly TempMasterApiClient _apiClient;
    private readonly DispatcherTimer _refreshTimer;
    private string _connectionStatus = "Connecting...";
    private bool _isConnected;
    private bool _isRefreshing;
    private string _selectedTimeScale = "day";
    private int _metersCount;
    private string _lastRefreshTime = "";
    private bool _isRateLimited;

    public event PropertyChangedEventHandler? PropertyChanged;

    public ObservableCollection<MeterViewModel> Meters { get; } = new();

    public string ConnectionStatus
    {
        get => _connectionStatus;
        set { _connectionStatus = value; OnPropertyChanged(); }
    }

    public bool IsConnected
    {
        get => _isConnected;
        set { _isConnected = value; OnPropertyChanged(); }
    }

    public bool IsRefreshing
    {
        get => _isRefreshing;
        set { _isRefreshing = value; OnPropertyChanged(); }
    }

    public string SelectedTimeScale
    {
        get => _selectedTimeScale;
        set
        {
            if (_selectedTimeScale != value)
            {
                _selectedTimeScale = value;
                OnPropertyChanged();
                _ = LoadHistoryForAllMetersAsync();
            }
        }
    }

    public int MetersCount
    {
        get => _metersCount;
        set { _metersCount = value; OnPropertyChanged(); }
    }

    public string LastRefreshTime
    {
        get => _lastRefreshTime;
        set { _lastRefreshTime = value; OnPropertyChanged(); }
    }

    public bool IsRateLimited
    {
        get => _isRateLimited;
        set { _isRateLimited = value; OnPropertyChanged(); }
    }

    public List<TimeScaleOption> TimeScaleOptions { get; } = new()
    {
        new("Last Hour", "hour"),
        new("Last 24 Hours", "day"),
        new("Last 7 Days", "week"),
        new("Last 30 Days", "month"),
        new("Last Year", "year"),
    };

    public MainViewModel()
    {
        _apiClient = new TempMasterApiClient();
        _refreshTimer = new DispatcherTimer
        {
            Interval = TimeSpan.FromSeconds(30)
        };
        _refreshTimer.Tick += async (_, _) => await LoadDataAsync();
        _ = InitializeAsync();
    }

    private async Task InitializeAsync()
    {
        await LoadDataAsync();
        _refreshTimer.Start();
    }

    public async Task LoadDataAsync()
    {
        try
        {
            IsRefreshing = true;

            var status = await _apiClient.GetStatusAsync();
            if (status != null)
            {
                IsConnected = status.Configured;
                IsRateLimited = status.RateLimited;
                ConnectionStatus = status.Configured ? "Connected" : "Not Configured";
            }

            var meters = await _apiClient.GetMetersAsync();
            MetersCount = meters.Count;
            LastRefreshTime = DateTime.Now.ToString("HH:mm:ss");

            UpdateMeters(meters);
            await LoadHistoryForAllMetersAsync();
        }
        catch (Exception ex)
        {
            IsConnected = false;
            ConnectionStatus = $"Error: {ex.Message}";
        }
        finally
        {
            IsRefreshing = false;
        }
    }

    private void UpdateMeters(List<MeterDevice> meters)
    {
        var existingIds = Meters.Select(m => m.DeviceId).ToHashSet();
        var newIds = meters.Select(m => m.DeviceId).ToHashSet();

        // Remove meters that no longer exist
        var toRemove = Meters.Where(m => !newIds.Contains(m.DeviceId)).ToList();
        foreach (var m in toRemove) Meters.Remove(m);

        foreach (var meter in meters)
        {
            var existing = Meters.FirstOrDefault(m => m.DeviceId == meter.DeviceId);
            if (existing != null)
            {
                existing.Update(meter);
            }
            else
            {
                Meters.Add(new MeterViewModel(meter));
            }
        }
    }

    private async Task LoadHistoryForAllMetersAsync()
    {
        foreach (var meter in Meters)
        {
            try
            {
                var history = await _apiClient.GetHistoryAsync(meter.DeviceId, SelectedTimeScale);
                meter.UpdateHistory(history);
            }
            catch
            {
                // Silently ignore individual history load failures
            }
        }
    }

    public async Task RefreshAsync()
    {
        try
        {
            IsRefreshing = true;
            await _apiClient.RefreshDataAsync();
            await Task.Delay(2000); // Wait for backend to collect new data
            await LoadDataAsync();
        }
        catch (Exception ex)
        {
            ConnectionStatus = $"Refresh failed: {ex.Message}";
        }
        finally
        {
            IsRefreshing = false;
        }
    }

    protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    public void Dispose()
    {
        _refreshTimer.Stop();
        _apiClient.Dispose();
    }
}

public class MeterViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    public string DeviceId { get; }
    public string DeviceName { get; private set; }
    public string DisplayName { get; private set; }
    public string DeviceType { get; private set; }

    private double? _temperature;
    public double? Temperature
    {
        get => _temperature;
        set { _temperature = value; OnPropertyChanged(); OnPropertyChanged(nameof(TemperatureText)); }
    }

    private int? _humidity;
    public int? Humidity
    {
        get => _humidity;
        set { _humidity = value; OnPropertyChanged(); OnPropertyChanged(nameof(HumidityText)); }
    }

    private int? _battery;
    public int? Battery
    {
        get => _battery;
        set { _battery = value; OnPropertyChanged(); OnPropertyChanged(nameof(BatteryText)); }
    }

    private string? _lastUpdated;
    public string? LastUpdated
    {
        get => _lastUpdated;
        set { _lastUpdated = value; OnPropertyChanged(); OnPropertyChanged(nameof(LastUpdatedText)); }
    }

    private ObservableCollection<MeterReading> _history = new();
    public ObservableCollection<MeterReading> History
    {
        get => _history;
        set { _history = value; OnPropertyChanged(); }
    }

    public string TemperatureText => Temperature.HasValue ? $"{Temperature:F1}°C" : "--";
    public string HumidityText => Humidity.HasValue ? $"{Humidity}%" : "--";
    public string BatteryText => Battery.HasValue ? $"{Battery}%" : "--";
    public string LastUpdatedText
    {
        get
        {
            if (string.IsNullOrEmpty(LastUpdated)) return "No data";
            if (DateTime.TryParse(LastUpdated, out var dt))
                return dt.ToLocalTime().ToString("yyyy/MM/dd HH:mm:ss");
            return LastUpdated;
        }
    }

    public MeterViewModel(MeterDevice device)
    {
        DeviceId = device.DeviceId;
        DeviceName = device.DeviceName;
        DisplayName = device.DisplayName;
        DeviceType = device.DeviceType;
        Temperature = device.CurrentTemperature;
        Humidity = device.CurrentHumidity;
        Battery = device.Battery;
        LastUpdated = device.LastUpdated;
    }

    public void Update(MeterDevice device)
    {
        DeviceName = device.DeviceName;
        DisplayName = device.DisplayName;
        DeviceType = device.DeviceType;
        Temperature = device.CurrentTemperature;
        Humidity = device.CurrentHumidity;
        Battery = device.Battery;
        LastUpdated = device.LastUpdated;
        OnPropertyChanged(nameof(DisplayName));
        OnPropertyChanged(nameof(DeviceType));
    }

    public void UpdateHistory(List<MeterReading> history)
    {
        History = new ObservableCollection<MeterReading>(history);
    }

    protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}

public class TimeScaleOption
{
    public string Label { get; }
    public string Value { get; }

    public TimeScaleOption(string label, string value)
    {
        Label = label;
        Value = value;
    }

    public override string ToString() => Label;
}
