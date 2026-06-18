using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using TempMaster.App.Models;
using TempMaster.App.Services;

namespace TempMaster.Tests;

public class TempMasterApiClientTests
{
    private sealed class RecordingHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;
        public HttpRequestMessage? LastRequest { get; private set; }

        public RecordingHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
        {
            _responder = responder;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            return Task.FromResult(_responder(request));
        }
    }

    private static HttpResponseMessage Json(string body)
        => new(HttpStatusCode.OK)
        {
            Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json"),
        };

    [Fact]
    public async Task GetMeters_DeserializesResponse()
    {
        var handler = new RecordingHandler(_ => Json(
            "{\"meters\":[{\"device_id\":\"abc\",\"device_name\":\"Bedroom Meter\",\"device_type\":\"Meter\",\"current_temperature\":21.5,\"current_humidity\":40,\"battery\":88}],\"last_updated\":\"2026-06-18T00:00:00Z\"}"));
        var http = new HttpClient(handler) { BaseAddress = new Uri("https://example.test/") };
        var client = new TempMasterApiClient(http);

        var result = await client.GetMetersAsync();

        Assert.Single(result.Meters);
        Assert.Equal("abc", result.Meters[0].DeviceId);
        Assert.Equal(21.5, result.Meters[0].CurrentTemperature);
        Assert.Equal(40, result.Meters[0].CurrentHumidity);
    }

    [Fact]
    public async Task GetStatus_DeserializesResponse()
    {
        var handler = new RecordingHandler(_ => Json(
            "{\"configured\":true,\"meters_count\":3,\"is_rate_limited\":false,\"backoff_remaining\":0,\"last_api_call\":0,\"collection_interval\":120}"));
        var http = new HttpClient(handler) { BaseAddress = new Uri("https://example.test/") };
        var client = new TempMasterApiClient(http);

        var status = await client.GetStatusAsync();

        Assert.True(status.Configured);
        Assert.Equal(3, status.MetersCount);
        Assert.Equal(120, status.CollectionInterval);
    }

    [Fact]
    public async Task GetHistory_UsesTimeScaleQuery()
    {
        var handler = new RecordingHandler(_ => Json(
            "{\"device_id\":\"abc\",\"time_scale\":\"week\",\"history\":[{\"timestamp\":\"2026-06-18T00:00:00Z\",\"temperature\":20.0,\"humidity\":50}]}"));
        var http = new HttpClient(handler) { BaseAddress = new Uri("https://example.test/") };
        var client = new TempMasterApiClient(http);

        var history = await client.GetHistoryAsync("abc", TimeScale.Week);

        Assert.Single(history.History);
        Assert.Contains("time_scale=week", handler.LastRequest!.RequestUri!.Query);
        Assert.Contains("api/meters/abc/history", handler.LastRequest!.RequestUri!.AbsolutePath);
    }

    [Fact]
    public void Constructor_RejectsEmptyBaseUrl()
    {
        Assert.Throws<ArgumentException>(() => new TempMasterApiClient(""));
    }
}
