using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using TempMaster.App.Models;

namespace TempMaster.App.Services;

public sealed class TempMasterApiClient : ITempMasterApi, IDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;
    private readonly bool _ownsHttp;

    public TempMasterApiClient(string baseUrl)
        : this(CreateHttpClient(baseUrl), ownsHttp: true)
    {
    }

    public TempMasterApiClient(HttpClient http, bool ownsHttp = false)
    {
        _http = http ?? throw new ArgumentNullException(nameof(http));
        _ownsHttp = ownsHttp;
    }

    private static HttpClient CreateHttpClient(string baseUrl)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            throw new ArgumentException("Base URL must be provided.", nameof(baseUrl));
        }

        var normalized = baseUrl.Trim().TrimEnd('/') + "/";
        return new HttpClient
        {
            BaseAddress = new Uri(normalized),
            Timeout = TimeSpan.FromSeconds(20),
        };
    }

    public async Task<BackendStatus> GetStatusAsync(CancellationToken ct = default)
    {
        var result = await _http.GetFromJsonAsync<BackendStatus>("api/status", JsonOptions, ct)
            .ConfigureAwait(false);
        return result ?? new BackendStatus();
    }

    public async Task<MetersResponse> GetMetersAsync(CancellationToken ct = default)
    {
        var result = await _http.GetFromJsonAsync<MetersResponse>("api/meters", JsonOptions, ct)
            .ConfigureAwait(false);
        return result ?? new MetersResponse();
    }

    public async Task<MeterHistoryResponse> GetHistoryAsync(string deviceId, TimeScale scale, CancellationToken ct = default)
    {
        var url = $"api/meters/{Uri.EscapeDataString(deviceId)}/history?time_scale={scale.ToApiValue()}";
        var result = await _http.GetFromJsonAsync<MeterHistoryResponse>(url, JsonOptions, ct)
            .ConfigureAwait(false);
        return result ?? new MeterHistoryResponse { DeviceId = deviceId, TimeScale = scale.ToApiValue() };
    }

    public async Task RefreshAsync(CancellationToken ct = default)
    {
        using var response = await _http.PostAsync("api/meters/refresh", content: null, ct).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();
    }

    public void Dispose()
    {
        if (_ownsHttp)
        {
            _http.Dispose();
        }
    }
}
