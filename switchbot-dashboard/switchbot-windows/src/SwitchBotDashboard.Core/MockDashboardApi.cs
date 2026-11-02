using SwitchBotDashboard.Core.Api;
using SwitchBotDashboard.Core.Models;

namespace SwitchBotDashboard.Core;

public sealed class MockDashboardApi : IDashboardApi
{
    public static readonly DateTimeOffset ScenarioNow =
        new(2026, 11, 2, 9, 0, 0, TimeSpan.Zero);

    public static readonly string[] ActiveDeviceIds =
    [
        "C76B0046301A",
        "D13234351576",
        "B0E9FEB9CFA6",
        "A1B2C3D4E5F6",
    ];

    public static readonly string[] StaleDeviceIds =
    [
        "F577B677EC96",
        "000000000000",
    ];

    private readonly IReadOnlyList<Meter> _meters =
    [
        new()
        {
            DeviceId = ActiveDeviceIds[0],
            DeviceName = "Bedroom Meter",
            DeviceType = "MeterPlus",
            CurrentTemperature = 20.0,
            CurrentHumidity = 71,
            Battery = 20,
            LastUpdated = ScenarioNow.AddMinutes(-2),
        },
        new()
        {
            DeviceId = ActiveDeviceIds[1],
            DeviceName = "アワコ",
            DeviceType = "Meter",
            CurrentTemperature = 26.8,
            CurrentHumidity = 68,
            Battery = 100,
            LastUpdated = ScenarioNow.AddMinutes(-2),
        },
        new()
        {
            DeviceId = ActiveDeviceIds[2],
            DeviceName = "Livingroom Hub",
            DeviceType = "Hub 3",
            HubDeviceId = string.Empty,
            CurrentTemperature = 18.9,
            CurrentHumidity = 65,
            Battery = null,
            LastUpdated = ScenarioNow.AddMinutes(-2),
        },
        new()
        {
            DeviceId = ActiveDeviceIds[3],
            DeviceName = "Garage Sensor",
            DeviceType = "Meter",
            CurrentTemperature = 15.2,
            CurrentHumidity = 55,
            Battery = 80,
            LastUpdated = ScenarioNow.AddHours(-1),
        },
        new()
        {
            DeviceId = StaleDeviceIds[0],
            DeviceName = "夢男",
            DeviceType = "Meter",
            CurrentTemperature = 24.1,
            CurrentHumidity = 85,
            Battery = 100,
            LastUpdated = new DateTimeOffset(2026, 2, 9, 2, 13, 39, TimeSpan.Zero),
        },
        new()
        {
            DeviceId = StaleDeviceIds[1],
            DeviceName = "Unknown Meter",
            DeviceType = "Meter",
            CurrentTemperature = null,
            CurrentHumidity = null,
            Battery = null,
            LastUpdated = null,
        },
    ];

    public Task<MetersResponse> GetMetersAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(new MetersResponse
        {
            Meters = _meters,
            LastUpdated = ScenarioNow,
        });
    }

    public Task<StatusResponse> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(new StatusResponse
        {
            Configured = true,
            MetersCount = _meters.Count,
            IsRateLimited = false,
            BackoffRemaining = 0,
            LastApiCall = ScenarioNow.ToUnixTimeSeconds(),
            CollectionInterval = 120,
        });
    }

    public Task<HistoryResponse> GetHistoryAsync(
        string deviceId,
        TimeScale timeScale,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var meter = _meters.FirstOrDefault(candidate => candidate.DeviceId == deviceId);
        var duration = timeScale switch
        {
            TimeScale.Hour => TimeSpan.FromHours(1),
            TimeScale.Day => TimeSpan.FromDays(1),
            TimeScale.Week => TimeSpan.FromDays(7),
            TimeScale.Month => TimeSpan.FromDays(30),
            TimeScale.Year => TimeSpan.FromDays(365),
            _ => throw new ArgumentOutOfRangeException(nameof(timeScale), timeScale, null),
        };
        var baseTemperature = meter?.CurrentTemperature ?? 20;
        var rangeOffset = (int)timeScale * 0.23;
        var history = Enumerable.Range(0, 12)
            .Select(index => new MeterReading
            {
                Timestamp = ScenarioNow - duration + TimeSpan.FromTicks(duration.Ticks * index / 11),
                Temperature = baseTemperature + Math.Sin(index * 0.72 + rangeOffset) * 0.4,
                Humidity = meter?.CurrentHumidity ?? 60,
                Battery = meter?.Battery,
            })
            .ToArray();

        return Task.FromResult(new HistoryResponse
        {
            DeviceId = deviceId,
            TimeScale = timeScale.ToApiValue(),
            History = history,
            Device = meter,
        });
    }

    public Task<RefreshResponse> RefreshAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(new RefreshResponse
        {
            Status = "success",
            Message = "Mock refresh complete",
            MetersCount = _meters.Count,
        });
    }
}
