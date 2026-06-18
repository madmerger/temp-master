using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TempMaster.App.Models;

namespace TempMaster.App.Services;

public interface ITempMasterApi
{
    Task<BackendStatus> GetStatusAsync(CancellationToken ct = default);

    Task<MetersResponse> GetMetersAsync(CancellationToken ct = default);

    Task<MeterHistoryResponse> GetHistoryAsync(string deviceId, TimeScale scale, CancellationToken ct = default);

    Task RefreshAsync(CancellationToken ct = default);
}
