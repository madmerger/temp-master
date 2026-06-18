using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Media;
using TempMaster.App.Models;
using TempMaster.App.Services;

namespace TempMaster.App.ViewModels;

public sealed class MainViewModel : ObservableObject
{
    private readonly AppSettings _settings;
    private readonly Func<string, ITempMasterApi> _apiFactory;
    private ITempMasterApi _api;

    private string _baseUrl;
    private int _refreshSeconds;
    private TimeScale _selectedTimeScale = TimeScale.Day;
    private bool _isBusy;
    private string _connectionStatus = "未接続";
    private bool _isConnected;
    private string? _errorText;
    private string _lastUpdatedText = "最終更新: --";
    private bool _reloadRequested;

    public MainViewModel(AppSettings settings, Func<string, ITempMasterApi>? apiFactory = null)
    {
        _settings = settings;
        _apiFactory = apiFactory ?? (url => new TempMasterApiClient(url));
        _baseUrl = settings.BaseUrl;
        _refreshSeconds = settings.EffectiveRefreshSeconds;
        _api = _apiFactory(_baseUrl);

        Meters = new ObservableCollection<MeterViewModel>();
        TimeScales = new[] { TimeScale.Hour, TimeScale.Day, TimeScale.Week, TimeScale.Month, TimeScale.Year };

        ReloadCommand = new AsyncRelayCommand(() => LoadAsync(triggerBackendRefresh: false), () => !IsBusy);
        RefreshNowCommand = new AsyncRelayCommand(() => LoadAsync(triggerBackendRefresh: true), () => !IsBusy);
        ApplySettingsCommand = new AsyncRelayCommand(ApplySettingsAsync, () => !IsBusy);
    }

    public ObservableCollection<MeterViewModel> Meters { get; }

    public IReadOnlyList<TimeScale> TimeScales { get; }

    public AsyncRelayCommand ReloadCommand { get; }

    public AsyncRelayCommand RefreshNowCommand { get; }

    public AsyncRelayCommand ApplySettingsCommand { get; }

    public string BaseUrl
    {
        get => _baseUrl;
        set => SetProperty(ref _baseUrl, value);
    }

    public int RefreshSeconds
    {
        get => _refreshSeconds;
        set => SetProperty(ref _refreshSeconds, value);
    }

    public TimeScale SelectedTimeScale
    {
        get => _selectedTimeScale;
        set
        {
            if (SetProperty(ref _selectedTimeScale, value))
            {
                // If a load is in flight, queue another so a rapid sequence of
                // selections still ends on the latest scale instead of being
                // silently dropped by the IsBusy guard.
                if (IsBusy)
                {
                    _reloadRequested = true;
                }
                else
                {
                    _ = LoadAsync(triggerBackendRefresh: false);
                }
            }
        }
    }

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (SetProperty(ref _isBusy, value))
            {
                ReloadCommand.RaiseCanExecuteChanged();
                RefreshNowCommand.RaiseCanExecuteChanged();
                ApplySettingsCommand.RaiseCanExecuteChanged();
            }
        }
    }

    public string ConnectionStatus
    {
        get => _connectionStatus;
        private set => SetProperty(ref _connectionStatus, value);
    }

    public bool IsConnected
    {
        get => _isConnected;
        private set
        {
            if (SetProperty(ref _isConnected, value))
            {
                OnPropertyChanged(nameof(StatusBrush));
            }
        }
    }

    public Brush StatusBrush => IsConnected
        ? new SolidColorBrush(Color.FromRgb(0x2E, 0xCC, 0x71))
        : new SolidColorBrush(Color.FromRgb(0xE7, 0x4C, 0x3C));

    public string? ErrorText
    {
        get => _errorText;
        private set => SetProperty(ref _errorText, value);
    }

    public string LastUpdatedText
    {
        get => _lastUpdatedText;
        private set => SetProperty(ref _lastUpdatedText, value);
    }

    public async Task ApplySettingsAsync()
    {
        var newBaseUrl = string.IsNullOrWhiteSpace(BaseUrl) ? AppSettings.DefaultBaseUrl : BaseUrl.Trim();

        // Build (and thereby validate) the new client before mutating any state.
        // An invalid URL must not be persisted or leave us with a disposed client.
        ITempMasterApi newApi;
        try
        {
            newApi = _apiFactory(newBaseUrl);
        }
        catch (Exception ex) when (ex is ArgumentException or UriFormatException)
        {
            ErrorText = $"無効なバックエンド URL です: {newBaseUrl}";
            return;
        }

        _settings.BaseUrl = newBaseUrl;
        _settings.RefreshSeconds = RefreshSeconds;
        _settings.Save();

        BaseUrl = _settings.BaseUrl;
        RefreshSeconds = _settings.EffectiveRefreshSeconds;

        (_api as IDisposable)?.Dispose();
        _api = newApi;

        await LoadAsync(triggerBackendRefresh: false).ConfigureAwait(true);
    }

    public async Task LoadAsync(bool triggerBackendRefresh, CancellationToken ct = default)
    {
        if (IsBusy)
        {
            return;
        }

        IsBusy = true;
        ErrorText = null;
        try
        {
            if (triggerBackendRefresh)
            {
                await _api.RefreshAsync(ct).ConfigureAwait(true);
            }

            var status = await _api.GetStatusAsync(ct).ConfigureAwait(true);
            var metersResponse = await _api.GetMetersAsync(ct).ConfigureAwait(true);

            IsConnected = true;
            ConnectionStatus = BuildStatusText(status);

            MergeMeters(metersResponse.Meters);

            LastUpdatedText = metersResponse.LastUpdated is DateTimeOffset d
                ? $"最終更新: {d.ToLocalTime():yyyy/MM/dd HH:mm:ss}"
                : "最終更新: --";

            await LoadHistoriesAsync(ct).ConfigureAwait(true);
        }
        catch (Exception ex)
        {
            IsConnected = false;
            ConnectionStatus = "接続エラー";
            ErrorText = ex.Message;
        }
        finally
        {
            IsBusy = false;

            if (_reloadRequested)
            {
                _reloadRequested = false;
                _ = LoadAsync(triggerBackendRefresh: false, ct);
            }
        }
    }

    private async Task LoadHistoriesAsync(CancellationToken ct)
    {
        foreach (var meter in Meters.ToList())
        {
            try
            {
                var history = await _api.GetHistoryAsync(meter.DeviceId, SelectedTimeScale, ct).ConfigureAwait(true);
                meter.SetHistory(history.History);
            }
            catch
            {
                meter.SetHistory(new List<MeterReading>());
            }
        }
    }

    private void MergeMeters(IReadOnlyList<Meter> incoming)
    {
        var byId = Meters.ToDictionary(m => m.DeviceId, StringComparer.Ordinal);
        var seen = new HashSet<string>(StringComparer.Ordinal);

        foreach (var meter in incoming)
        {
            seen.Add(meter.DeviceId);
            if (byId.TryGetValue(meter.DeviceId, out var existing))
            {
                existing.UpdateFrom(meter);
            }
            else
            {
                Meters.Add(new MeterViewModel(meter));
            }
        }

        for (int i = Meters.Count - 1; i >= 0; i--)
        {
            if (!seen.Contains(Meters[i].DeviceId))
            {
                Meters.RemoveAt(i);
            }
        }
    }

    private static string BuildStatusText(BackendStatus status)
    {
        if (!status.Configured)
        {
            return "未設定 (認証情報なし)";
        }

        if (status.IsRateLimited)
        {
            return $"レート制限中 (残り {status.BackoffRemaining} 秒)";
        }

        return $"接続中 ・ {status.MetersCount} 台";
    }
}
