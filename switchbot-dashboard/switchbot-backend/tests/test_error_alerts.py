import json
import time
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from fastapi.routing import APIRoute

import app.alerts as alerts_module
import app.main as main_module
from app.main import app


@pytest.fixture(autouse=True)
def reset_alerts():
    alerts_module.reset_alert_state()
    yield
    alerts_module.reset_alert_state()


async def raise_test_error():
    raise RuntimeError("boom")


app.router.routes.insert(
    len(app.router.routes) - 1,
    APIRoute("/api/test-raise-500", raise_test_error, methods=["GET"]),
)


class FakeSlackResponse:
    def __init__(self, status_code=200, body=None):
        self.status_code = status_code
        self._body = body if body is not None else {"ok": True}

    def json(self):
        return self._body


class FakeSlackClient:
    calls = []
    response = FakeSlackResponse()

    def __init__(self, timeout=None):
        self.timeout = timeout

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def post(self, url, headers=None, json=None):
        type(self).calls.append({"url": url, "headers": headers, "json": json})
        return type(self).response


@pytest.fixture
def slack_env(monkeypatch):
    monkeypatch.setenv("SLACK_BOT_TOKEN", "xoxb-test-token")
    monkeypatch.setenv("SLACK_ONCALL_ALERTS_CHANNEL_ID", "C0123TEST")
    monkeypatch.setenv("FLY_APP_NAME", "temp-master")
    FakeSlackClient.calls = []
    FakeSlackClient.response = FakeSlackResponse()
    monkeypatch.setattr(alerts_module.httpx, "AsyncClient", FakeSlackClient)
    return FakeSlackClient


class TestRequestMiddleware:
    def test_unhandled_error_returns_500_json_with_request_id(self, reset_data_store):
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/api/test-raise-500")

        assert response.status_code == 500
        data = response.json()
        assert data["detail"] == "Internal Server Error"
        assert data["request_id"]
        assert response.headers["X-Request-ID"] == data["request_id"]

    def test_request_id_header_on_normal_response(self, client):
        response = client.get("/healthz")

        assert response.status_code == 200
        assert response.headers["X-Request-ID"]

    def test_5xx_triggers_error_alert(self, reset_data_store):
        mock_alert = AsyncMock(return_value=True)
        client = TestClient(app, raise_server_exceptions=False)
        with patch.object(main_module, "post_error_alert", mock_alert):
            response = client.get("/api/test-raise-500")
            for _ in range(100):
                if mock_alert.called:
                    break
                time.sleep(0.01)

        assert response.status_code == 500
        assert mock_alert.called
        call = mock_alert.call_args
        method = call.kwargs.get("method", call.args[0] if call.args else None)
        path = call.kwargs.get("path", call.args[1] if len(call.args) > 1 else None)
        status = call.kwargs.get("status_code", call.args[2] if len(call.args) > 2 else None)
        assert method == "GET"
        assert path == "/api/test-raise-500"
        assert status == 500


class TestPostErrorAlert:
    async def test_not_configured_returns_false(self, monkeypatch):
        monkeypatch.delenv("SLACK_BOT_TOKEN", raising=False)
        monkeypatch.delenv("SLACK_ONCALL_ALERTS_CHANNEL_ID", raising=False)
        called = []

        async def fake_post(self, *args, **kwargs):
            called.append((args, kwargs))

        monkeypatch.setattr(alerts_module.httpx.AsyncClient, "post", fake_post)

        result = await alerts_module.post_error_alert("GET", "/api/x", 500, 1.0, "req1")

        assert result is False
        assert called == []

    async def test_posts_alert_card(self, slack_env):
        result = await alerts_module.post_error_alert("GET", "/api/x", 500, 12.5, "req123")

        assert result is True
        assert len(slack_env.calls) == 1
        call = slack_env.calls[0]
        assert call["url"] == alerts_module.SLACK_API_URL
        assert call["headers"]["Authorization"] == "Bearer xoxb-test-token"
        payload = call["json"]
        assert payload["channel"] == "C0123TEST"
        assert "[ALERT] temp-master: HTTP 500 on GET /api/x" in payload["text"]
        payload_str = json.dumps(payload)
        assert "Traceback" not in payload_str
        assert "RuntimeError" not in payload_str
        assert "madmerger/temp-master" in payload_str

    async def test_cooldown_skips_second_alert(self, slack_env):
        first = await alerts_module.post_error_alert("GET", "/api/x", 500, 1.0, "r1")
        second = await alerts_module.post_error_alert("GET", "/api/x", 500, 1.0, "r2")

        assert first is True
        assert second is False
        assert len(slack_env.calls) == 1

    async def test_slack_not_ok_returns_false(self, slack_env):
        slack_env.response = FakeSlackResponse(body={"ok": False, "error": "channel_not_found"})

        result = await alerts_module.post_error_alert("GET", "/api/y", 500, 1.0, "r1")

        assert result is False

    async def test_http_error_does_not_raise(self, slack_env):
        slack_env.response = FakeSlackResponse(status_code=500, body={})

        result = await alerts_module.post_error_alert("GET", "/api/z", 500, 1.0, "r1")

        assert result is False


class TestBackupEndpoint:
    def test_backup_404_when_db_missing(self, reset_data_store):
        original = main_module.DB_PATH
        main_module.DB_PATH = "/nonexistent/path/missing.db"
        try:
            client = TestClient(app)
            response = client.get("/api/backup")
        finally:
            main_module.DB_PATH = original

        assert response.status_code == 404
        assert response.json()["detail"] == "Database file not found"
