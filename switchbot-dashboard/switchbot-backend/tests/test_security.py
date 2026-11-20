import sqlite3
from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.alerts as alerts
import app.main as main


@pytest.fixture
def admin(monkeypatch):
    monkeypatch.setenv("ADMIN_API_TOKEN", "admin-test")
    return {"Authorization": "Bearer admin-test"}


@pytest.mark.parametrize("method,path", [
    ("GET", "/api/backup"), ("POST", "/api/meters/refresh"), ("POST", "/api/import"),
])
@pytest.mark.parametrize("authorization", [None, "Bearer wrong", "Basic wrong", "Bearer 日本語"])
async def test_auth_rejected(admin, method, path, authorization):
    headers = {} if authorization is None else {"Authorization": authorization}
    if authorization == "Bearer 日本語":
        headers = {b"Authorization": authorization.encode("utf-8")}
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=main.app), base_url="http://test") as client:
        response = await client.request(method, path, headers=headers, json={"devices": []})
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize("method,path", [
    ("GET", "/api/backup"), ("POST", "/api/meters/refresh"), ("POST", "/api/import"),
])
@pytest.mark.parametrize("token", [None, ""])
def test_auth_unconfigured(monkeypatch, method, path, token):
    monkeypatch.delenv("ADMIN_API_TOKEN", raising=False)
    if token is not None:
        monkeypatch.setenv("ADMIN_API_TOKEN", token)
    response = TestClient(main.app).request(method, path, headers={"Authorization": "Bearer anything"}, json={"devices": []})
    assert response.status_code == 503


def test_refresh_success(admin, monkeypatch, reset_data_store):
    collect = AsyncMock()
    monkeypatch.setattr(main, "collect_data", collect)
    monkeypatch.setattr(main, "SWITCHBOT_TOKEN", "test")
    monkeypatch.setattr(main, "SWITCHBOT_SECRET", "test")
    response = TestClient(main.app).post("/api/meters/refresh", headers=admin)
    assert response.status_code == 200
    collect.assert_awaited_once()


def test_import_and_backup_success(admin, monkeypatch, reset_data_store, tmp_path):
    backups = tmp_path / "backups"
    backups.mkdir()
    monkeypatch.setattr(main, "BACKUP_DIR", str(backups))
    client = TestClient(main.app)
    response = client.post("/api/import", headers=admin, json={"devices": [{
        "device_id": "imported", "device_name": "Imported meter", "device_type": "Meter",
        "readings": [{"timestamp": "2026-01-01T00:00:00Z", "temperature": 22.5, "humidity": 40}],
    }]})
    assert response.status_code == 200
    assert response.json()["imported_readings"] == 1
    response = client.get("/api/backup", headers=admin)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/x-sqlite3"
    assert response.content.startswith(b"SQLite format 3\x00")
    snapshot = sqlite3.connect(":memory:")
    try:
        snapshot.deserialize(response.content)
        assert snapshot.execute("SELECT device_id FROM devices").fetchall() == [("imported",)]
        assert snapshot.execute("SELECT temperature FROM readings").fetchall() == [(22.5,)]
    finally:
        snapshot.close()
    assert list(backups.iterdir()) == []
    assert client.post("/api/import", headers=admin, json={"devices": []}).status_code == 200
    assert client.post("/api/import", headers=admin, json={}).status_code == 422
    monkeypatch.setattr(main, "DB_PATH", str(tmp_path / "missing.db"))
    assert client.get("/api/backup", headers=admin).status_code == 404


@pytest.mark.parametrize("path,status", [("/healthz", 200), ("/not-found", 404), ("/api/latency-logs?start_time=invalid", 500)])
def test_security_headers(path, status, monkeypatch, caplog):
    monkeypatch.setattr(main, "post_error_alert", AsyncMock())
    response = TestClient(main.app, raise_server_exceptions=False).get(path)
    assert response.status_code == status
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert response.headers["content-security-policy"] == (
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; "
        "object-src 'none'; base-uri 'self'"
    )


@pytest.mark.parametrize("path", ["/docs", "/docs/oauth2-redirect", "/redoc"])
def test_docs_csp(path):
    response = TestClient(main.app).get(path)
    assert response.status_code == 200
    assert "https://cdn.jsdelivr.net 'unsafe-inline'" in response.headers["content-security-policy"]
    if path == "/redoc":
        assert "worker-src 'self' blob:" in response.headers["content-security-policy"]
    else:
        assert "worker-src" not in response.headers["content-security-policy"]


def test_csp_connect(monkeypatch):
    monkeypatch.setenv("CSP_CONNECT_SRC", "https://api.example.com, https://other.example.com")
    response = TestClient(main.app).get("/healthz")
    assert "connect-src 'self' https://api.example.com https://other.example.com;" in response.headers["content-security-policy"]


@pytest.mark.parametrize("origins", [None, "", "*", "https://allowed.example, https://second.example"])
def test_cors(monkeypatch, origins):
    monkeypatch.delenv("CORS_ALLOW_ORIGINS", raising=False)
    if origins is not None:
        monkeypatch.setenv("CORS_ALLOW_ORIGINS", origins)
    application = FastAPI()
    main.configure_cors(application)
    application.add_api_route("/healthz", main.healthz)
    client = TestClient(application)
    for origin in ["https://allowed.example", "https://second.example", "https://denied.example"]:
        allowed = bool(origins and origin in origins and origins != "*")
        response = client.get("/healthz", headers={"Origin": origin})
        assert response.headers.get("access-control-allow-origin") == (origin if allowed else None)
        assert "access-control-allow-credentials" not in response.headers
        preflight = client.options("/healthz", headers={
            "Origin": origin, "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization,Content-Type",
        })
        assert preflight.headers.get("access-control-allow-origin") == (origin if allowed else None)
        if allowed:
            assert preflight.status_code == 200
            assert "Authorization" in preflight.headers["access-control-allow-headers"]


def test_spa_routes(tmp_path):
    static = tmp_path / "dist"
    static.mkdir()
    (static / "assets").mkdir()
    (static / "index.html").write_text("<html>SPA</html>")
    (static / "assets" / "app.js").write_text("console.log('SPA')")
    (tmp_path / "secret.txt").write_text("secret")
    (static / "escape").symlink_to(tmp_path / "secret.txt")
    application = FastAPI()
    main.register_spa_routes(application, static)
    client = TestClient(application)
    for path in ["/", "/meters/123", "/missing"]:
        assert client.get(path).text == "<html>SPA</html>"
    assert client.get("/assets/app.js").text == "console.log('SPA')"
    for path in ["/%2e%2e/secret.txt", "/assets/%2e%2e/%2e%2e/secret.txt", "/escape"]:
        assert client.get(path).status_code == 404
    empty_app = FastAPI()
    main.register_spa_routes(empty_app, tmp_path / "absent")
    assert TestClient(empty_app).get("/").status_code == 404


async def test_upstream_error_not_disclosed(reset_data_store, monkeypatch):
    monkeypatch.setattr(main, "SWITCHBOT_TOKEN", "test")
    monkeypatch.setattr(main, "SWITCHBOT_SECRET", "test")
    response = httpx.Response(502, text="sensitive-upstream-body")
    mock = AsyncMock()
    mock.__aenter__.return_value.get.return_value = response
    monkeypatch.setattr(main.httpx, "AsyncClient", lambda: mock)
    with pytest.raises(main.HTTPException) as error:
        await main.call_switchbot_api("/devices")
    assert "sensitive" not in error.value.detail
    logs = await main.get_latency_logs()
    assert "sensitive" not in logs[0].error_message


async def test_slack_error_not_logged(monkeypatch, caplog):
    monkeypatch.setenv("SLACK_BOT_TOKEN", "test")
    monkeypatch.setenv("SLACK_ONCALL_ALERTS_CHANNEL_ID", "test")
    mock = AsyncMock()
    mock.__aenter__.return_value.post.side_effect = RuntimeError("sensitive-slack-error")
    monkeypatch.setattr(alerts.httpx, "AsyncClient", lambda **kwargs: mock)
    alerts.reset_alert_state()
    assert not await alerts.post_error_alert("GET", "/api/x", 500, 1, "request")
    assert "sensitive" not in caplog.text
