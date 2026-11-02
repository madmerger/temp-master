using System.Net;

namespace SwitchBotDashboard.Core.Api;

public sealed class DashboardApiException : HttpRequestException
{
    public DashboardApiException(HttpStatusCode statusCode, string? detail)
        : base(
            string.IsNullOrWhiteSpace(detail)
                ? $"The dashboard API returned HTTP {(int)statusCode}."
                : detail,
            null,
            statusCode)
    {
        Detail = detail;
    }

    public string? Detail { get; }
}
