using System.Collections.Concurrent;
using Microsoft.Extensions.Time.Testing;
using SwitchBotDashboard.Core.Api;
using SwitchBotDashboard.Core.Models;
using Xunit;

namespace SwitchBotDashboard.Core.Tests;

public sealed class DashboardViewModelTests
{
    [Fact]
    public async Task LoadSplitsActiveAndStaleAndRequestsHistoryOnlyForActiveMeters()
    {
        var api = new TrackingApi();
        var viewModel = new DashboardViewModel(api, new FakeTimeProvider(MockDashboardApi.ScenarioNow));

        Assert.Equal(TimeScale.Day, viewModel.SelectedTimeScale);
        await viewModel.LoadAsync();

        Assert.Equal(4, viewModel.ActiveMeters.Count);
        Assert.Equal(2, viewModel.StaleMeters.Count);
        Assert.Contains(viewModel.ActiveMeters, meter => meter.DisplayName == "第1蒸留塔 (T-101)");
        Assert.Contains(viewModel.ActiveMeters, meter => meter.DisplayName == "冷却塔 (CT-401)");
        Assert.Contains(viewModel.ActiveMeters, meter => meter.DisplayName == "Garage Sensor");
        Assert.Contains(viewModel.StaleMeters, meter => meter.DisplayName == "熱交換器 (E-301)");
        Assert.Null(viewModel.ActiveMeters.Single(meter => meter.DeviceId == MockDashboardApi.ActiveDeviceIds[2]).BatteryText);
        var noData = Assert.Single(viewModel.StaleMeters, meter => meter.DeviceId == MockDashboardApi.StaleDeviceIds[1]);
        Assert.False(noData.HasValues);
        Assert.Equal(4, api.HistoryRequests.Count);
        Assert.All(api.HistoryRequests, request =>
        {
            Assert.Equal(TimeScale.Day, request.TimeScale);
            Assert.Contains(request.DeviceId, MockDashboardApi.ActiveDeviceIds);
        });
        Assert.Equal("Connected", viewModel.ConnectionText);
        Assert.Equal("Monitoring 6 meters", viewModel.StatusText);
    }

    [Fact]
    public async Task TimeScaleChangeRefetchesHistoryForActiveMetersOnly()
    {
        var api = new TrackingApi();
        var viewModel = new DashboardViewModel(api, new FakeTimeProvider(MockDashboardApi.ScenarioNow));
        await viewModel.LoadAsync();

        viewModel.SelectedTimeScale = TimeScale.Week;
        await EventuallyAsync(() => api.HistoryRequests.Count(request => request.TimeScale == TimeScale.Week) == 4);

        var weekRequests = api.HistoryRequests.Where(request => request.TimeScale == TimeScale.Week).ToArray();
        Assert.Equal(
            MockDashboardApi.ActiveDeviceIds.OrderBy(id => id),
            weekRequests.Select(request => request.DeviceId).OrderBy(id => id));
        Assert.DoesNotContain(weekRequests, request => MockDashboardApi.StaleDeviceIds.Contains(request.DeviceId));
        Assert.NotEmpty(viewModel.ActiveMeters[0].Points);
        Assert.All(viewModel.ActiveMeters[0].Labels, label => Assert.Contains(' ', label));
    }

    [Fact]
    public async Task LateHistoryForOldTimeScaleDoesNotReplaceCurrentSeries()
    {
        var api = new TrackingApi();
        var dayResponse = new TaskCompletionSource<HistoryResponse>(TaskCreationOptions.RunContinuationsAsynchronously);
        var weekResponse = new TaskCompletionSource<HistoryResponse>(TaskCreationOptions.RunContinuationsAsynchronously);
        api.HistoryFactory = (deviceId, timeScale, _) =>
        {
            return timeScale == TimeScale.Day ? dayResponse.Task : weekResponse.Task;
        };
        var viewModel = new DashboardViewModel(api, new FakeTimeProvider(MockDashboardApi.ScenarioNow));

        var loadTask = viewModel.LoadAsync();
        await EventuallyAsync(() => api.HistoryRequests.Count(request => request.TimeScale == TimeScale.Day) == 4);
        viewModel.SelectedTimeScale = TimeScale.Week;
        await EventuallyAsync(() => api.HistoryRequests.Count(request => request.TimeScale == TimeScale.Week) == 4);
        weekResponse.SetResult(new HistoryResponse
        {
            DeviceId = MockDashboardApi.ActiveDeviceIds[0],
            TimeScale = TimeScale.Week.ToApiValue(),
            History = [new MeterReading { Timestamp = MockDashboardApi.ScenarioNow.AddDays(-7), Temperature = 7 }],
        });
        await EventuallyAsync(() => viewModel.ActiveMeters[0].Points.SingleOrDefault()?.Temperature == 7);
        dayResponse.SetResult(new HistoryResponse
        {
            DeviceId = MockDashboardApi.ActiveDeviceIds[0],
            TimeScale = TimeScale.Day.ToApiValue(),
            History = [new MeterReading { Timestamp = MockDashboardApi.ScenarioNow.AddDays(-1), Temperature = 1 }],
        });
        await loadTask;

        Assert.Equal(7, viewModel.ActiveMeters[0].Points.Single().Temperature);
    }

    [Fact]
    public async Task RefreshFailureSurvivesSuccessfulFollowUpLoad()
    {
        var api = new TrackingApi { RefreshException = new InvalidOperationException("refresh denied") };
        var viewModel = new DashboardViewModel(api, new FakeTimeProvider(MockDashboardApi.ScenarioNow));

        await viewModel.RefreshAsync();

        Assert.Equal("Failed to refresh: refresh denied", viewModel.ErrorMessage);
        Assert.Equal(ConnectionState.Connected, viewModel.ConnectionState);
    }

    [Fact]
    public async Task PollingRecoversFromApiFailureAfterThirtySeconds()
    {
        var timeProvider = new FakeTimeProvider(MockDashboardApi.ScenarioNow);
        var api = new TrackingApi { FailNextMetersRequest = true };
        var viewModel = new DashboardViewModel(api, timeProvider);

        viewModel.StartPolling();
        await EventuallyAsync(() => viewModel.ConnectionState == ConnectionState.Disconnected);
        Assert.StartsWith("Failed to fetch meters:", viewModel.ErrorMessage);

        timeProvider.Advance(TimeSpan.FromSeconds(30));
        await EventuallyAsync(() => viewModel.ConnectionState == ConnectionState.Connected);
        viewModel.StopPolling();

        Assert.Null(viewModel.ErrorMessage);
        Assert.True(api.MetersRequests >= 2);
    }

    [Fact]
    public async Task RateLimitTextIncludesBackoffDuration()
    {
        var api = new TrackingApi
        {
            Status = new StatusResponse
            {
                Configured = true,
                MetersCount = 6,
                IsRateLimited = true,
                BackoffRemaining = 17,
            },
        };
        var viewModel = new DashboardViewModel(api, new FakeTimeProvider(MockDashboardApi.ScenarioNow));

        await viewModel.LoadAsync();

        Assert.Equal("SwitchBot API rate limit reached. Retry in 17 seconds.", viewModel.RateLimitText);
    }

    [Fact]
    public void MeterCardFormatsReadingsAndHidesNullBattery()
    {
        var card = new MeterCardViewModel(
            new Meter
            {
                DeviceId = "hub",
                DeviceName = "Hub",
                DeviceType = "Hub 3",
                CurrentTemperature = 24.1,
                CurrentHumidity = 85,
                Battery = null,
            },
            "Control Panel",
            false);

        Assert.Equal("24.1°C", card.TemperatureText);
        Assert.Equal("85%", card.HumidityText);
        Assert.Null(card.BatteryText);
        Assert.True(card.HasValues);
    }

    private static async Task EventuallyAsync(Func<bool> predicate)
    {
        var timeout = DateTime.UtcNow + TimeSpan.FromSeconds(5);
        while (!predicate())
        {
            if (DateTime.UtcNow >= timeout)
            {
                throw new TimeoutException("The expected asynchronous state was not reached.");
            }

            await Task.Delay(10);
        }
    }

    private sealed class TrackingApi : IDashboardApi
    {
        private readonly MockDashboardApi _inner = new();
        private int _failNextMetersRequest;

        public ConcurrentQueue<(string DeviceId, TimeScale TimeScale)> HistoryRequests { get; } = new();

        public Func<string, TimeScale, CancellationToken, Task<HistoryResponse>>? HistoryFactory { get; set; }

        public Exception? RefreshException { get; init; }

        public bool FailNextMetersRequest
        {
            get => Volatile.Read(ref _failNextMetersRequest) == 1;
            init => _failNextMetersRequest = value ? 1 : 0;
        }

        public int MetersRequests { get; private set; }

        public StatusResponse Status { get; init; } = new()
        {
            Configured = true,
            MetersCount = 6,
            CollectionInterval = 120,
        };

        public Task<MetersResponse> GetMetersAsync(CancellationToken cancellationToken = default)
        {
            MetersRequests++;
            if (Interlocked.Exchange(ref _failNextMetersRequest, 0) == 1)
            {
                return Task.FromException<MetersResponse>(new InvalidOperationException("service unavailable"));
            }

            return _inner.GetMetersAsync(cancellationToken);
        }

        public Task<StatusResponse> GetStatusAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(Status);

        public Task<HistoryResponse> GetHistoryAsync(
            string deviceId,
            TimeScale timeScale,
            CancellationToken cancellationToken = default)
        {
            HistoryRequests.Enqueue((deviceId, timeScale));
            if (HistoryFactory is not null)
            {
                return HistoryFactory(deviceId, timeScale, cancellationToken);
            }

            return _inner.GetHistoryAsync(deviceId, timeScale, cancellationToken);
        }

        public Task<RefreshResponse> RefreshAsync(CancellationToken cancellationToken = default) =>
            RefreshException is null
                ? _inner.RefreshAsync(cancellationToken)
                : Task.FromException<RefreshResponse>(RefreshException);
    }
}
