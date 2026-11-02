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
    public async Task RefreshFailureSurvivesSuccessfulHistoryAfterTimeScaleChange()
    {
        var api = new TrackingApi { RefreshException = new InvalidOperationException("refresh denied") };
        var viewModel = new DashboardViewModel(api, new FakeTimeProvider(MockDashboardApi.ScenarioNow));
        await viewModel.RefreshAsync();
        api.HistoryFactory = (deviceId, timeScale, _) => Task.FromResult(new HistoryResponse
        {
            DeviceId = deviceId,
            TimeScale = timeScale.ToApiValue(),
            History =
            [
                new MeterReading
                {
                    Timestamp = MockDashboardApi.ScenarioNow,
                    Temperature = 42,
                },
            ],
        });

        viewModel.SelectedTimeScale = TimeScale.Week;

        Assert.Equal("Failed to refresh: refresh denied", viewModel.ErrorMessage);
        Assert.Equal(42, viewModel.ActiveMeters[0].Points.Single().Temperature);
    }

    [Fact]
    public async Task SuccessfulHistoryAfterTimeScaleChangeClearsPriorHistoryError()
    {
        var api = new TrackingApi
        {
            HistoryFactory = (_, _, _) =>
                Task.FromException<HistoryResponse>(new InvalidOperationException("history unavailable")),
        };
        var viewModel = new DashboardViewModel(api, new FakeTimeProvider(MockDashboardApi.ScenarioNow));
        await viewModel.LoadAsync();
        viewModel.SelectedTimeScale = TimeScale.Week;

        Assert.Equal("Failed to fetch history: history unavailable", viewModel.ErrorMessage);

        api.HistoryFactory = (deviceId, timeScale, _) => Task.FromResult(new HistoryResponse
        {
            DeviceId = deviceId,
            TimeScale = timeScale.ToApiValue(),
            History =
            [
                new MeterReading
                {
                    Timestamp = MockDashboardApi.ScenarioNow,
                    Temperature = 42,
                },
            ],
        });
        viewModel.SelectedTimeScale = TimeScale.Month;

        Assert.Null(viewModel.ErrorMessage);
        Assert.Equal(42, viewModel.ActiveMeters[0].Points.Single().Temperature);
    }

    [Fact]
    public async Task HistoryFailureDuringLoadIsReportedWithoutDisconnecting()
    {
        var api = new TrackingApi
        {
            HistoryFactory = (_, _, _) =>
                Task.FromException<HistoryResponse>(new InvalidOperationException("history unavailable")),
        };
        var viewModel = new DashboardViewModel(api, new FakeTimeProvider(MockDashboardApi.ScenarioNow));

        await viewModel.LoadAsync();

        Assert.Equal("Failed to fetch history: history unavailable", viewModel.ErrorMessage);
        Assert.Equal(ConnectionState.Connected, viewModel.ConnectionState);
    }

    [Fact]
    public async Task HistoryFailureKeepsOtherMetersHistory()
    {
        var now = MockDashboardApi.ScenarioNow;
        var api = new TrackingApi
        {
            MetersResponse = new MetersResponse
            {
                Meters =
                [
                    new Meter
                    {
                        DeviceId = "failing-meter",
                        DeviceName = "Failing meter",
                        DeviceType = "Meter",
                        LastUpdated = now,
                    },
                    new Meter
                    {
                        DeviceId = "successful-meter",
                        DeviceName = "Successful meter",
                        DeviceType = "Meter",
                        LastUpdated = now,
                    },
                ],
            },
            HistoryFactory = (deviceId, timeScale, _) => deviceId == "failing-meter"
                ? Task.FromException<HistoryResponse>(new InvalidOperationException("history unavailable"))
                : Task.FromResult(new HistoryResponse
                {
                    DeviceId = deviceId,
                    TimeScale = timeScale.ToApiValue(),
                    History =
                    [
                        new MeterReading
                        {
                            Timestamp = now.AddHours(-1),
                            Temperature = 23,
                        },
                    ],
                }),
        };
        var viewModel = new DashboardViewModel(api, new FakeTimeProvider(now));

        await viewModel.LoadAsync();

        var successfulMeter = Assert.Single(
            viewModel.ActiveMeters,
            meter => meter.DeviceId == "successful-meter");
        Assert.Equal(23, Assert.Single(successfulMeter.Points).Temperature);
        Assert.Equal("Failed to fetch history: history unavailable", viewModel.ErrorMessage);
        Assert.Equal(ConnectionState.Connected, viewModel.ConnectionState);
    }

    [Fact]
    public async Task FailedTimeScaleChangeClearsOnlyTheFailedMetersHistory()
    {
        var now = MockDashboardApi.ScenarioNow;
        var api = new TrackingApi
        {
            MetersResponse = new MetersResponse
            {
                Meters =
                [
                    new Meter
                    {
                        DeviceId = "failing-meter",
                        DeviceName = "Failing meter",
                        DeviceType = "Meter",
                        LastUpdated = now,
                    },
                    new Meter
                    {
                        DeviceId = "successful-meter",
                        DeviceName = "Successful meter",
                        DeviceType = "Meter",
                        LastUpdated = now,
                    },
                ],
            },
            HistoryFactory = (deviceId, timeScale, _) =>
                timeScale == TimeScale.Week && deviceId == "failing-meter"
                    ? Task.FromException<HistoryResponse>(new InvalidOperationException("history unavailable"))
                    : Task.FromResult(new HistoryResponse
                    {
                        DeviceId = deviceId,
                        TimeScale = timeScale.ToApiValue(),
                        History =
                        [
                            new MeterReading
                            {
                                Timestamp = now.AddHours(-1),
                                Temperature = timeScale == TimeScale.Day ? 21 : 42,
                            },
                        ],
                    }),
        };
        var viewModel = new DashboardViewModel(api, new FakeTimeProvider(now));

        await viewModel.LoadAsync();
        Assert.Equal(21, Assert.Single(
            viewModel.ActiveMeters.Single(meter => meter.DeviceId == "failing-meter").Points).Temperature);
        Assert.Equal(21, Assert.Single(
            viewModel.ActiveMeters.Single(meter => meter.DeviceId == "successful-meter").Points).Temperature);

        viewModel.SelectedTimeScale = TimeScale.Week;
        await EventuallyAsync(() =>
            viewModel.ErrorMessage?.StartsWith("Failed to fetch history:", StringComparison.Ordinal) == true
            && viewModel.ActiveMeters.Single(meter => meter.DeviceId == "failing-meter").Points.Count == 0
            && viewModel.ActiveMeters.Single(meter => meter.DeviceId == "successful-meter").Points
                .SingleOrDefault()?.Temperature == 42);

        Assert.Equal(ConnectionState.Connected, viewModel.ConnectionState);
        Assert.StartsWith("Failed to fetch history:", viewModel.ErrorMessage);
    }

    [Fact]
    public async Task RefreshWaitsForInFlightLoadAndPerformsFollowUpReload()
    {
        var firstMetersRequestStarted = new TaskCompletionSource<bool>(
            TaskCreationOptions.RunContinuationsAsynchronously);
        var firstMetersResponse = new TaskCompletionSource<MetersResponse>(
            TaskCreationOptions.RunContinuationsAsynchronously);
        var refreshRequested = new TaskCompletionSource<bool>(
            TaskCreationOptions.RunContinuationsAsynchronously);
        var api = new TrackingApi
        {
            FirstMetersRequestStarted = firstMetersRequestStarted,
            FirstMetersResponse = firstMetersResponse,
            RefreshRequested = refreshRequested,
        };
        var viewModel = new DashboardViewModel(api, new FakeTimeProvider(MockDashboardApi.ScenarioNow));

        var loadTask = viewModel.LoadAsync();
        await firstMetersRequestStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));
        var refreshTask = viewModel.RefreshAsync();
        await refreshRequested.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.False(refreshTask.IsCompleted);
        Assert.Equal(1, api.MetersRequests);

        firstMetersResponse.SetResult(new MetersResponse { Meters = [] });
        await Task.WhenAll(loadTask, refreshTask);

        Assert.Equal(2, api.MetersRequests);
    }

    [Fact]
    public async Task HasStaleMetersTracksChangesAndRaisesPropertyChanged()
    {
        var api = new TrackingApi
        {
            MetersResponse = new MetersResponse
            {
                Meters =
                [
                    new Meter
                    {
                        DeviceId = "stale-meter",
                        DeviceName = "Stale meter",
                        DeviceType = "Meter",
                        LastUpdated = null,
                    },
                ],
            },
        };
        var viewModel = new DashboardViewModel(api, new FakeTimeProvider(MockDashboardApi.ScenarioNow));
        var changedProperties = new List<string?>();
        viewModel.PropertyChanged += (_, args) => changedProperties.Add(args.PropertyName);

        Assert.False(viewModel.HasStaleMeters);
        await viewModel.LoadAsync();
        Assert.True(viewModel.HasStaleMeters);

        api.MetersResponse = new MetersResponse { Meters = [] };
        await viewModel.LoadAsync();

        Assert.False(viewModel.HasStaleMeters);
        Assert.Equal(2, changedProperties.Count(propertyName => propertyName == nameof(viewModel.HasStaleMeters)));
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
        private int _metersRequests;

        public ConcurrentQueue<(string DeviceId, TimeScale TimeScale)> HistoryRequests { get; } = new();

        public Func<string, TimeScale, CancellationToken, Task<HistoryResponse>>? HistoryFactory { get; set; }

        public Exception? RefreshException { get; init; }

        public TaskCompletionSource<bool>? FirstMetersRequestStarted { get; init; }

        public TaskCompletionSource<MetersResponse>? FirstMetersResponse { get; init; }

        public TaskCompletionSource<bool>? RefreshRequested { get; init; }

        public MetersResponse? MetersResponse { get; set; }

        public bool FailNextMetersRequest
        {
            get => Volatile.Read(ref _failNextMetersRequest) == 1;
            init => _failNextMetersRequest = value ? 1 : 0;
        }

        public int MetersRequests => Volatile.Read(ref _metersRequests);

        public StatusResponse Status { get; init; } = new()
        {
            Configured = true,
            MetersCount = 6,
            CollectionInterval = 120,
        };

        public async Task<MetersResponse> GetMetersAsync(CancellationToken cancellationToken = default)
        {
            var requestNumber = Interlocked.Increment(ref _metersRequests);
            if (requestNumber == 1 && FirstMetersResponse is not null)
            {
                FirstMetersRequestStarted?.TrySetResult(true);
                return await FirstMetersResponse.Task.WaitAsync(cancellationToken);
            }

            if (Interlocked.Exchange(ref _failNextMetersRequest, 0) == 1)
            {
                throw new InvalidOperationException("service unavailable");
            }

            if (MetersResponse is not null)
            {
                return MetersResponse;
            }

            return await _inner.GetMetersAsync(cancellationToken);
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

        public Task<RefreshResponse> RefreshAsync(CancellationToken cancellationToken = default)
        {
            RefreshRequested?.TrySetResult(true);
            return RefreshException is null
                ? _inner.RefreshAsync(cancellationToken)
                : Task.FromException<RefreshResponse>(RefreshException);
        }
    }
}
