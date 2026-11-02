using System.Text.Json;
using SwitchBotDashboard.Core.Models;

namespace SwitchBotDashboard.Core.Api;

public sealed class DashboardApiClient : IDashboardApi
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _httpClient;
    private readonly Uri _baseUrl;

    public DashboardApiClient(HttpClient httpClient, Uri baseUrl)
    {
        _httpClient = httpClient;
        _baseUrl = new Uri(baseUrl.AbsoluteUri.TrimEnd('/') + "/", UriKind.Absolute);
    }

    public Task<MetersResponse> GetMetersAsync(CancellationToken cancellationToken = default) =>
        GetAsync<MetersResponse>("api/meters", cancellationToken);

    public Task<StatusResponse> GetStatusAsync(CancellationToken cancellationToken = default) =>
        GetAsync<StatusResponse>("api/status", cancellationToken);

    public Task<HistoryResponse> GetHistoryAsync(
        string deviceId,
        TimeScale timeScale,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(deviceId);
        var escapedDeviceId = Uri.EscapeDataString(deviceId);
        var path = $"api/meters/{escapedDeviceId}/history?time_scale={timeScale.ToApiValue()}";
        return GetAsync<HistoryResponse>(path, cancellationToken);
    }

    public Task<RefreshResponse> RefreshAsync(CancellationToken cancellationToken = default) =>
        SendAsync<RefreshResponse>(
            new HttpRequestMessage(HttpMethod.Post, new Uri(_baseUrl, "api/meters/refresh")),
            cancellationToken);

    private Task<TResponse> GetAsync<TResponse>(string relativePath, CancellationToken cancellationToken) =>
        SendAsync<TResponse>(
            new HttpRequestMessage(HttpMethod.Get, new Uri(_baseUrl, relativePath)),
            cancellationToken);

    private async Task<TResponse> SendAsync<TResponse>(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        using (request)
        using (var response = await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false))
        {
            var content = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                throw new DashboardApiException(response.StatusCode, ReadDetail(content));
            }

            return JsonSerializer.Deserialize<TResponse>(content, JsonOptions)
                ?? throw new JsonException("The dashboard API returned an empty response.");
        }
    }

    private static string? ReadDetail(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(content);
            return document.RootElement.ValueKind == JsonValueKind.Object
                && document.RootElement.TryGetProperty("detail", out var detail)
                    ? detail.ValueKind == JsonValueKind.String
                        ? detail.GetString()
                        : detail.ToString()
                    : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
