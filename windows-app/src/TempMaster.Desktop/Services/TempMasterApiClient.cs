using System.Net.Http;
using System.Net.Http.Json;
using TempMaster.Desktop.Models;

namespace TempMaster.Desktop.Services;

/// <summary>Thin HTTP client for the Temp Master FastAPI backend.</summary>
public sealed class TempMasterApiClient : IDisposable
{
    public const string DefaultBaseUrl = "https://temp-master.fly.dev";

    private readonly HttpClient _http;

    public TempMasterApiClient(string? baseUrl = null)
    {
        _http = new HttpClient
        {
            BaseAddress = new Uri((baseUrl ?? DefaultBaseUrl).TrimEnd('/') + "/"),
            Timeout = TimeSpan.FromSeconds(30),
        };
    }

    public string BaseUrl => _http.BaseAddress!.ToString();

    public async Task<MetersResponse> GetMetersAsync(CancellationToken ct = default)
        => await _http.GetFromJsonAsync<MetersResponse>("api/meters", ct).ConfigureAwait(false)
           ?? new MetersResponse();

    public async Task<StatusResponse> GetStatusAsync(CancellationToken ct = default)
        => await _http.GetFromJsonAsync<StatusResponse>("api/status", ct).ConfigureAwait(false)
           ?? new StatusResponse();

    public async Task<HistoryResponse> GetHistoryAsync(string deviceId, string timeScale, CancellationToken ct = default)
    {
        var url = $"api/meters/{Uri.EscapeDataString(deviceId)}/history?time_scale={timeScale}";
        return await _http.GetFromJsonAsync<HistoryResponse>(url, ct).ConfigureAwait(false)
               ?? new HistoryResponse();
    }

    public async Task RefreshAsync(CancellationToken ct = default)
    {
        using var resp = await _http.PostAsync("api/meters/refresh", content: null, ct).ConfigureAwait(false);
        resp.EnsureSuccessStatusCode();
    }

    public Uri BackupUri => new(_http.BaseAddress!, "api/backup");

    public void Dispose() => _http.Dispose();
}
