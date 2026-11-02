using System.Net;
using System.Text;
using SwitchBotDashboard.Core.Api;
using Xunit;

namespace SwitchBotDashboard.Core.Tests;

public sealed class DashboardApiClientTests
{
    [Fact]
    public async Task ClientUsesEscapedHistoryUrlAndPostsRefresh()
    {
        var requests = new List<(HttpMethod Method, string Uri)>();
        var handler = new DelegateHandler(request =>
        {
            requests.Add((request.Method, request.RequestUri!.AbsoluteUri));
            var json = request.Method == HttpMethod.Post
                ? """{"status":"success","message":"complete","meters_count":1}"""
                : """{"device_id":"sensor/1","time_scale":"week","history":[]}""";
            return JsonResponse(HttpStatusCode.OK, json);
        });
        using var client = new HttpClient(handler);
        var api = new DashboardApiClient(client, new Uri("https://example.test"));

        await api.GetHistoryAsync("sensor/1", TimeScale.Week);
        await api.RefreshAsync();

        Assert.Equal(HttpMethod.Get, requests[0].Method);
        Assert.Contains("/api/meters/sensor%2F1/history?time_scale=week", requests[0].Uri);
        Assert.Equal(HttpMethod.Post, requests[1].Method);
        Assert.EndsWith("/api/meters/refresh", requests[1].Uri, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ClientUsesMetersAndStatusEndpoints()
    {
        var requests = new List<string>();
        var handler = new DelegateHandler(request =>
        {
            requests.Add(request.RequestUri!.AbsolutePath);
            var json = request.RequestUri.AbsolutePath.EndsWith("/meters", StringComparison.Ordinal)
                ? """{"meters":[],"last_updated":null}"""
                : """{"configured":true,"meters_count":0,"is_rate_limited":false,"backoff_remaining":0,"last_api_call":0,"collection_interval":120}""";
            return JsonResponse(HttpStatusCode.OK, json);
        });
        using var client = new HttpClient(handler);
        var api = new DashboardApiClient(client, new Uri("https://example.test/"));

        await api.GetMetersAsync();
        await api.GetStatusAsync();

        Assert.Equal(new[] { "/api/meters", "/api/status" }, requests);
    }

    [Fact]
    public async Task ClientMapsFastApiDetailAndStatusCode()
    {
        var handler = new DelegateHandler(_ =>
            JsonResponse(HttpStatusCode.NotFound, """{"detail":"Device not found"}"""));
        using var client = new HttpClient(handler);
        var api = new DashboardApiClient(client, new Uri("https://example.test/"));

        var exception = await Assert.ThrowsAsync<DashboardApiException>(
            () => api.GetHistoryAsync("missing", TimeScale.Hour));

        Assert.Equal(HttpStatusCode.NotFound, exception.StatusCode);
        Assert.Equal("Device not found", exception.Detail);
        Assert.Equal("Device not found", exception.Message);
    }

    [Fact]
    public async Task ClientUsesConfiguredApiBasePath()
    {
        string? requestedUri = null;
        var handler = new DelegateHandler(request =>
        {
            requestedUri = request.RequestUri!.AbsoluteUri;
            return JsonResponse(HttpStatusCode.OK, """{"meters":[],"last_updated":null}""");
        });
        using var client = new HttpClient(handler);
        var api = new DashboardApiClient(client, new Uri("https://example.test/dashboard"));

        await api.GetMetersAsync();

        Assert.Equal("https://example.test/dashboard/api/meters", requestedUri);
    }

    private static HttpResponseMessage JsonResponse(HttpStatusCode statusCode, string content) =>
        new(statusCode)
        {
            Content = new StringContent(content, Encoding.UTF8, "application/json"),
        };

    private sealed class DelegateHandler(
        Func<HttpRequestMessage, HttpResponseMessage> responseFactory) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(responseFactory(request));
    }
}
