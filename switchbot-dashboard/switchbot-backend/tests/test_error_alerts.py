import json
import re
import sqlite3
import time
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

import app.alerts as alerts_module
import app.main as main_module
from app.main import app


@pytest.fixture(autouse=True)
def reset_alerts():
    alerts_module.reset_alert_state()
    yield
    alerts_module.reset_alert_state()


@app.get("/api/test-raise-500")
async def raise_test_error():
    raise RuntimeError("boom")


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
    def test_backup_preflight_rejects_cross_origin_authorization_header(self, client):
        response = client.options(
            "/api/backup",
            headers={
                "Origin": "https://evil.example",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
            },
        )

        assert response.status_code == 400
        assert "authorization" not in response.headers.get("access-control-allow-headers", "").lower()

    def test_backup_requires_authorization_header(self, client, monkeypatch):
        monkeypatch.setattr(main_module, "BACKUP_API_TOKEN", "test-backup-token")

        response = client.get("/api/backup")

        assert response.status_code == 401
        assert response.headers["WWW-Authenticate"] == "Bearer"
        assert response.json()["detail"] == "Not authenticated"

    def test_backup_rejects_wrong_token(self, client, monkeypatch):
        monkeypatch.setattr(main_module, "BACKUP_API_TOKEN", "test-backup-token")

        response = client.get("/api/backup", headers={"Authorization": "Bearer wrong-token"})

        assert response.status_code == 401
        assert response.headers["WWW-Authenticate"] == "Bearer"

    def test_backup_rejects_non_bearer_scheme(self, client, monkeypatch):
        monkeypatch.setattr(main_module, "BACKUP_API_TOKEN", "test-backup-token")

        response = client.get("/api/backup", headers={"Authorization": "Basic test-backup-token"})

        assert response.status_code == 401
        assert response.headers["WWW-Authenticate"] == "Bearer"

    def test_backup_rejects_any_token_when_server_token_is_unset(self, client, monkeypatch):
        monkeypatch.setattr(main_module, "BACKUP_API_TOKEN", "")

        response = client.get("/api/backup", headers={"Authorization": "Bearer test-backup-token"})

        assert response.status_code == 401
        assert response.headers["WWW-Authenticate"] == "Bearer"

    def test_backup_404_when_db_missing(self, client, monkeypatch, tmp_path):
        monkeypatch.setattr(main_module, "BACKUP_API_TOKEN", "test-backup-token")
        monkeypatch.setattr(main_module, "DB_PATH", str(tmp_path / "missing.db"))

        response = client.get("/api/backup", headers={"Authorization": "Bearer test-backup-token"})

        assert response.status_code == 404
        assert response.json()["detail"] == "Database file not found"

    def test_backup_returns_sqlite_snapshot_and_removes_temporary_file(self, client, monkeypatch, tmp_path):
        db_path = tmp_path / "source.db"
        with sqlite3.connect(db_path) as db:
            db.execute("CREATE TABLE backup_test (value TEXT)")
            db.execute("INSERT INTO backup_test VALUES ('present')")
        backup_dir = tmp_path / "backups"
        backup_dir.mkdir()
        monkeypatch.setattr(main_module, "DB_PATH", str(db_path))
        monkeypatch.setattr(main_module, "BACKUP_DIR", str(backup_dir))
        monkeypatch.setattr(main_module, "BACKUP_API_TOKEN", "test-backup-token")

        response = client.get("/api/backup", headers={"Authorization": "Bearer test-backup-token"})

        assert response.status_code == 200
        assert response.content.startswith(b"SQLite format 3\x00")
        assert re.search(
            r'filename="?switchbot_backup_\d{8}_\d{6}\.db"?',
            response.headers["content-disposition"],
        )
        assert list(backup_dir.iterdir()) == []

    def test_consecutive_backups_each_return_valid_sqlite_content(self, client, monkeypatch, tmp_path):
        db_path = tmp_path / "source.db"
        with sqlite3.connect(db_path) as db:
            db.execute("CREATE TABLE backup_test (value TEXT)")
            db.execute("INSERT INTO backup_test VALUES ('present')")
        backup_dir = tmp_path / "backups"
        backup_dir.mkdir()
        monkeypatch.setattr(main_module, "DB_PATH", str(db_path))
        monkeypatch.setattr(main_module, "BACKUP_DIR", str(backup_dir))
        monkeypatch.setattr(main_module, "BACKUP_API_TOKEN", "test-backup-token")

        responses = [
            client.get("/api/backup", headers={"Authorization": "Bearer test-backup-token"})
            for _ in range(2)
        ]

        assert all(response.status_code == 200 for response in responses)
        assert all(response.content.startswith(b"SQLite format 3\x00") for response in responses)
        assert list(backup_dir.iterdir()) == []

    def test_backup_returns_429_when_another_backup_is_in_progress(self, client, monkeypatch):
        monkeypatch.setattr(main_module, "BACKUP_API_TOKEN", "test-backup-token")

        class LockedBackup:
            @staticmethod
            def locked():
                return True

        monkeypatch.setattr(main_module, "_backup_lock", LockedBackup())
        response = client.get("/api/backup", headers={"Authorization": "Bearer test-backup-token"})

        assert response.status_code == 429
        assert response.json()["detail"] == "Backup already in progress"

    def test_backup_removes_snapshot_when_sqlite_backup_raises(self, reset_data_store, monkeypatch, tmp_path):
        backup_dir = tmp_path / "backups"
        backup_dir.mkdir()
        monkeypatch.setattr(main_module, "BACKUP_DIR", str(backup_dir))
        monkeypatch.setattr(main_module, "BACKUP_API_TOKEN", "test-backup-token")
        monkeypatch.setattr(
            main_module.aiosqlite.Connection,
            "backup",
            AsyncMock(side_effect=RuntimeError("SQLite backup failed")),
        )
        client = TestClient(app, raise_server_exceptions=False)

        response = client.get("/api/backup", headers={"Authorization": "Bearer test-backup-token"})

        assert response.status_code == 500
        assert list(backup_dir.iterdir()) == []

    def test_lifespan_removes_stale_backup_snapshots(self, reset_data_store, monkeypatch, tmp_path):
        backup_dir = tmp_path / "backups"
        backup_dir.mkdir()
        stale_snapshot = backup_dir / "switchbot_backup_x.db"
        stale_snapshot.touch()
        monkeypatch.setattr(main_module, "BACKUP_DIR", str(backup_dir))

        with TestClient(app):
            assert not stale_snapshot.exists()
