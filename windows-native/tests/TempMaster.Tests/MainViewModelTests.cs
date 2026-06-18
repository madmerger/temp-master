using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TempMaster.App.Models;
using TempMaster.App.Services;
using TempMaster.App.ViewModels;

namespace TempMaster.Tests;

public class MainViewModelTests
{
    private sealed class FakeApi : ITempMasterApi
    {
        public List<Meter> Meters { get; set; } = new();
        public BackendStatus Status { get; set; } = new() { Configured = true, MetersCount = 1 };
        public int HistoryCalls { get; private set; }
        public bool RefreshCalled { get; private set; }

        public Task<BackendStatus> GetStatusAsync(CancellationToken ct = default) => Task.FromResult(Status);

        public Task<MetersResponse> GetMetersAsync(CancellationToken ct = default)
            => Task.FromResult(new MetersResponse { Meters = Meters });

        public Task<MeterHistoryResponse> GetHistoryAsync(string deviceId, TimeScale scale, CancellationToken ct = default)
        {
            HistoryCalls++;
            return Task.FromResult(new MeterHistoryResponse
            {
                DeviceId = deviceId,
                History = new List<MeterReading>
                {
                    new() { Temperature = 20, Humidity = 50 },
                },
            });
        }

        public Task RefreshAsync(CancellationToken ct = default)
        {
            RefreshCalled = true;
            return Task.CompletedTask;
        }
    }

    private static Meter Meter(string id, double temp) => new()
    {
        DeviceId = id,
        DeviceName = "Bedroom Meter",
        DeviceType = "Meter",
        CurrentTemperature = temp,
        CurrentHumidity = 40,
        Battery = 90,
    };

    [Fact]
    public async Task LoadAsync_PopulatesMetersAndHistory()
    {
        var api = new FakeApi { Meters = { Meter("a", 21), Meter("b", 22) } };
        var vm = new MainViewModel(new AppSettings(), _ => api);

        await vm.LoadAsync(triggerBackendRefresh: false);

        Assert.Equal(2, vm.Meters.Count);
        Assert.True(vm.IsConnected);
        Assert.Equal(2, api.HistoryCalls);
        Assert.All(vm.Meters, m => Assert.Single(m.History));
    }

    [Fact]
    public async Task LoadAsync_MergesWithoutDuplicating()
    {
        var api = new FakeApi { Meters = { Meter("a", 21) } };
        var vm = new MainViewModel(new AppSettings(), _ => api);

        await vm.LoadAsync(triggerBackendRefresh: false);
        api.Meters = new List<Meter> { Meter("a", 25) };
        await vm.LoadAsync(triggerBackendRefresh: false);

        Assert.Single(vm.Meters);
        Assert.Equal("25.0°C", vm.Meters[0].TemperatureText);
    }

    [Fact]
    public async Task LoadAsync_RemovesMetersNoLongerPresent()
    {
        var api = new FakeApi { Meters = { Meter("a", 21), Meter("b", 22) } };
        var vm = new MainViewModel(new AppSettings(), _ => api);

        await vm.LoadAsync(triggerBackendRefresh: false);
        api.Meters = new List<Meter> { Meter("a", 21) };
        await vm.LoadAsync(triggerBackendRefresh: false);

        Assert.Single(vm.Meters);
        Assert.Equal("a", vm.Meters[0].DeviceId);
    }

    [Fact]
    public async Task LoadAsync_WithBackendRefresh_CallsRefresh()
    {
        var api = new FakeApi();
        var vm = new MainViewModel(new AppSettings(), _ => api);

        await vm.LoadAsync(triggerBackendRefresh: true);

        Assert.True(api.RefreshCalled);
    }

    [Fact]
    public async Task ApplySettings_PersistsAndRebuildsClient()
    {
        AppSettings.DirectoryOverride = System.IO.Path.Combine(
            System.IO.Path.GetTempPath(), "TempMasterTests", System.Guid.NewGuid().ToString("N"));
        var built = new List<string>();
        var api = new FakeApi();
        var vm = new MainViewModel(new AppSettings { BaseUrl = "https://one.test" }, url =>
        {
            built.Add(url);
            return api;
        })
        {
            BaseUrl = "https://two.test",
            RefreshSeconds = 5,
        };

        await vm.ApplySettingsAsync();

        Assert.Contains("https://two.test", built);
        Assert.Equal(AppSettings.MinRefreshSeconds, vm.RefreshSeconds);
    }
}
