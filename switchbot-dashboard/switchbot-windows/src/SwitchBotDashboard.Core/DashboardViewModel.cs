using System.Collections.ObjectModel;
using System.Globalization;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SwitchBotDashboard.Core.Api;
using SwitchBotDashboard.Core.Models;

namespace SwitchBotDashboard.Core;

public enum ConnectionState
{
    Connecting,
    Connected,
    Disconnected,
}

public sealed partial class DashboardViewModel : ObservableObject
{
    private const string HistoryErrorPrefix = "Failed to fetch history:";

    private readonly IDashboardApi _api;
    private readonly TimeProvider _timeProvider;
    private readonly DisplayNameMap _displayNameMap;
    private readonly SemaphoreSlim _loadGate = new(1, 1);
    private readonly ObservableCollection<MeterCardViewModel> _activeMeters = [];
    private readonly ObservableCollection<MeterCardViewModel> _staleMeters = [];
    private CancellationTokenSource? _pollingCancellation;
    private long _historyGeneration;
    private TimeScale _selectedTimeScale = TimeScale.Day;
    private ConnectionState _connectionState = global::SwitchBotDashboard.Core.ConnectionState.Connecting;
    private string? _errorMessage;
    private string _statusText = "Monitoring 0 meters";
    private string? _lastRefreshText;
    private string? _rateLimitText;
    private bool _isLoading;

    public DashboardViewModel(IDashboardApi api, TimeProvider timeProvider, bool useMockData = false)
    {
        _api = api;
        _timeProvider = timeProvider;
        _displayNameMap = new DisplayNameMap();
        UseMockData = useMockData;
    }

    public bool UseMockData { get; }

    public ObservableCollection<MeterCardViewModel> ActiveMeters => _activeMeters;

    public ObservableCollection<MeterCardViewModel> StaleMeters => _staleMeters;

    public bool HasStaleMeters => _staleMeters.Count > 0;

    public TimeScale SelectedTimeScale
    {
        get => _selectedTimeScale;
        set
        {
            if (SetProperty(ref _selectedTimeScale, value) && _activeMeters.Count > 0)
            {
                var generation = Interlocked.Increment(ref _historyGeneration);
                _ = FetchSelectedHistoriesAsync(_activeMeters.ToArray(), value, generation);
            }
        }
    }

    public ConnectionState ConnectionState
    {
        get => _connectionState;
        private set
        {
            if (SetProperty(ref _connectionState, value))
            {
                OnPropertyChanged(nameof(ConnectionText));
            }
        }
    }

    public string ConnectionText => ConnectionState switch
    {
        global::SwitchBotDashboard.Core.ConnectionState.Connecting => "Connecting",
        global::SwitchBotDashboard.Core.ConnectionState.Connected => "Connected",
        global::SwitchBotDashboard.Core.ConnectionState.Disconnected => "Disconnected",
        _ => throw new ArgumentOutOfRangeException(),
    };

    public string? ErrorMessage
    {
        get => _errorMessage;
        private set => SetProperty(ref _errorMessage, value);
    }

    public string StatusText
    {
        get => _statusText;
        private set => SetProperty(ref _statusText, value);
    }

    public string? LastRefreshText
    {
        get => _lastRefreshText;
        private set => SetProperty(ref _lastRefreshText, value);
    }

    public string? RateLimitText
    {
        get => _rateLimitText;
        private set => SetProperty(ref _rateLimitText, value);
    }

    public bool IsLoading
    {
        get => _isLoading;
        private set => SetProperty(ref _isLoading, value);
    }

    [RelayCommand]
    private Task Load() => LoadAsync();

    [RelayCommand]
    private Task Refresh() => RefreshAsync();

    public Task LoadAsync(CancellationToken cancellationToken = default) =>
        LoadAsync(false, cancellationToken);

    internal async Task LoadAsync(bool waitForGate, CancellationToken cancellationToken)
    {
        if (waitForGate)
        {
            await _loadGate.WaitAsync(cancellationToken);
        }
        else if (!await _loadGate.WaitAsync(0, cancellationToken))
        {
            return;
        }

        try
        {
            IsLoading = true;
            MetersResponse? meters = null;
            StatusResponse? status = null;
            Exception? metersError = null;
            Exception? statusError = null;
            string? historyError = null;

            try
            {
                meters = await _api.GetMetersAsync(cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                metersError = exception;
            }

            try
            {
                status = await _api.GetStatusAsync(cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                statusError = exception;
            }

            if (meters is not null)
            {
                UpdateMeters(meters.Meters);
                StatusText = FormatStatusText(meters.Meters.Count);
                var historyGeneration = Interlocked.Increment(ref _historyGeneration);
                historyError = await FetchHistoriesAsync(
                    _activeMeters.ToArray(),
                    SelectedTimeScale,
                    historyGeneration,
                    cancellationToken);
            }

            if (status is not null)
            {
                RateLimitText = status.IsRateLimited
                    ? $"SwitchBot API rate limit reached. Retry in {status.BackoffRemaining} seconds."
                    : null;
            }

            LastRefreshText = $"Last refresh: {_timeProvider.GetLocalNow().ToString("HH:mm:ss", CultureInfo.InvariantCulture)}";
            ConnectionState = metersError is null && statusError is null
                ? global::SwitchBotDashboard.Core.ConnectionState.Connected
                : global::SwitchBotDashboard.Core.ConnectionState.Disconnected;
            var metersErrorMessage = metersError is not null
                ? $"Failed to fetch meters: {metersError.Message}"
                : null;
            var statusErrorMessage = statusError is not null
                ? $"Failed to fetch status: {statusError.Message}"
                : null;
            ErrorMessage = metersErrorMessage ?? statusErrorMessage ?? historyError;
        }
        finally
        {
            IsLoading = false;
            _loadGate.Release();
        }
    }

    public async Task RefreshAsync(CancellationToken cancellationToken = default)
    {
        string? refreshError = null;
        try
        {
            await _api.RefreshAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            refreshError = $"Failed to refresh: {exception.Message}";
        }

        await LoadAsync(true, cancellationToken);
        if (refreshError is not null)
        {
            ErrorMessage = refreshError;
        }
    }

    public void StartPolling()
    {
        if (_pollingCancellation is not null)
        {
            return;
        }

        _pollingCancellation = new CancellationTokenSource();
        _ = LoadAsync(_pollingCancellation.Token);
        _ = PollAsync(_pollingCancellation.Token);
    }

    public void StopPolling()
    {
        var cancellation = _pollingCancellation;
        _pollingCancellation = null;
        cancellation?.Cancel();
    }

    private void UpdateMeters(IReadOnlyList<Meter> meters)
    {
        var now = _timeProvider.GetUtcNow();
        var active = new List<MeterCardViewModel>();
        var stale = new List<MeterCardViewModel>();

        foreach (var meter in meters)
        {
            var isStale = StaleMeterPolicy.IsStale(meter.LastUpdated, now);
            var card = new MeterCardViewModel(meter, _displayNameMap.Resolve(meter.DeviceName), isStale);
            (isStale ? stale : active).Add(card);
        }

        Replace(_activeMeters, active);
        Replace(_staleMeters, stale);
        OnPropertyChanged(nameof(HasStaleMeters));
    }

    private async Task<string?> FetchHistoriesAsync(
        IReadOnlyList<MeterCardViewModel> meters,
        TimeScale timeScale,
        long generation,
        CancellationToken cancellationToken)
    {
        if (meters.Count == 0)
        {
            return null;
        }

        var responses = new HistoryResponse?[meters.Count];
        var errors = new string?[meters.Count];
        try
        {
            await Task.WhenAll(meters.Select(async (meter, index) =>
            {
                try
                {
                    responses[index] = await _api.GetHistoryAsync(
                        meter.DeviceId,
                        timeScale,
                        cancellationToken);
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception exception)
                {
                    errors[index] = exception.Message;
                }
            }));

            if (generation != Interlocked.Read(ref _historyGeneration)
                || timeScale != SelectedTimeScale)
            {
                return null;
            }

            for (var index = 0; index < meters.Count; index++)
            {
                if (responses[index] is { } response)
                {
                    meters[index].SetHistory(response.History, timeScale);
                }
            }

            var firstError = errors.FirstOrDefault(error => error is not null);
            return firstError is null ? null : $"{HistoryErrorPrefix} {firstError}";
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            return generation == Interlocked.Read(ref _historyGeneration)
                ? $"{HistoryErrorPrefix} {exception.Message}"
                : null;
        }
    }

    private async Task FetchSelectedHistoriesAsync(
        IReadOnlyList<MeterCardViewModel> meters,
        TimeScale timeScale,
        long generation)
    {
        var errorMessage = await FetchHistoriesAsync(
            meters,
            timeScale,
            generation,
            CancellationToken.None);
        if (generation != Interlocked.Read(ref _historyGeneration))
        {
            return;
        }

        if (errorMessage is not null)
        {
            ErrorMessage = errorMessage;
        }
        else if (ErrorMessage?.StartsWith(HistoryErrorPrefix, StringComparison.Ordinal) == true)
        {
            ErrorMessage = null;
        }
    }

    private async Task PollAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30), _timeProvider);
            while (await timer.WaitForNextTickAsync(cancellationToken))
            {
                await LoadAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
    }

    private static string FormatStatusText(int count) =>
        $"Monitoring {count} meter{(count == 1 ? string.Empty : "s")}";

    private static void Replace<T>(ObservableCollection<T> target, IEnumerable<T> items)
    {
        target.Clear();
        foreach (var item in items)
        {
            target.Add(item);
        }
    }
}
