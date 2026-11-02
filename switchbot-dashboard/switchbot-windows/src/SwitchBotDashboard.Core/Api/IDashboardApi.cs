using SwitchBotDashboard.Core.Models;

namespace SwitchBotDashboard.Core.Api;

public interface IDashboardApi
{
    Task<MetersResponse> GetMetersAsync(CancellationToken cancellationToken = default);

    Task<StatusResponse> GetStatusAsync(CancellationToken cancellationToken = default);

    Task<HistoryResponse> GetHistoryAsync(
        string deviceId,
        TimeScale timeScale,
        CancellationToken cancellationToken = default);

    Task<RefreshResponse> RefreshAsync(CancellationToken cancellationToken = default);
}
