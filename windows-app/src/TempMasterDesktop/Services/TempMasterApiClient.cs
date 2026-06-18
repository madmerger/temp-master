using System.Net.Http;
using System.Text.Json;
using TempMasterDesktop.Models;

namespace TempMasterDesktop.Services;

public class TempMasterApiClient : IDisposable
{
    private readonly HttpClient _httpClient;
    private const string DefaultBaseUrl = "https://temp-master.fly.dev";

    public string BaseUrl { get; }

    public TempMasterApiClient(string? baseUrl = null)
    {
        BaseUrl = baseUrl ?? DefaultBaseUrl;
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(BaseUrl),
            Timeout = TimeSpan.FromSeconds(15)
        };
    }

    public async Task<StatusResponse?> GetStatusAsync()
    {
        var response = await _httpClient.GetAsync("/api/status");
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<StatusResponse>(json);
    }

    public async Task<List<MeterDevice>> GetMetersAsync()
    {
        var response = await _httpClient.GetAsync("/api/meters");
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<MetersResponse>(json);
        return result?.Meters ?? new List<MeterDevice>();
    }

    public async Task<List<MeterReading>> GetHistoryAsync(string deviceId, string timeScale)
    {
        var response = await _httpClient.GetAsync($"/api/meters/{deviceId}/history?time_scale={timeScale}");
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<HistoryResponse>(json);
        return result?.History ?? new List<MeterReading>();
    }

    public async Task RefreshDataAsync()
    {
        var response = await _httpClient.PostAsync("/api/meters/refresh", null);
        response.EnsureSuccessStatusCode();
    }

    public void Dispose()
    {
        _httpClient.Dispose();
    }
}
