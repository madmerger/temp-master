import logging
import os
import time
from collections import deque
from datetime import datetime, timezone

import httpx

logger = logging.getLogger("temp_master")

SLACK_API_URL = "https://slack.com/api/chat.postMessage"
REPOSITORY = "madmerger/temp-master"
ERROR_WINDOW_SECONDS = 300

# (method, path) -> deque of error timestamps within the rolling window
_error_windows: dict[tuple[str, str], deque] = {}
# (method, path) -> timestamp of the last successful Slack post
_last_alert_at: dict[tuple[str, str], float] = {}


def reset_alert_state() -> None:
    """Clear rolling-window and cooldown state (for tests)."""
    _error_windows.clear()
    _last_alert_at.clear()


def _record_error(method: str, path: str) -> int:
    now = time.time()
    window = _error_windows.setdefault((method, path), deque())
    window.append(now)
    cutoff = now - ERROR_WINDOW_SECONDS
    while window and window[0] < cutoff:
        window.popleft()
    return len(window)


def _build_alert_payload(
    method: str,
    path: str,
    status_code: int,
    latency_ms: float,
    request_id: str,
    errors_in_window: int,
) -> dict:
    service = os.getenv("FLY_APP_NAME", "temp-master")
    channel = os.getenv("SLACK_ONCALL_ALERTS_CHANNEL_ID", "")
    summary = f"[ALERT] {service}: HTTP {status_code} on {method} {path}"
    fields = [
        {"type": "mrkdwn", "text": f"*Service*\n{service}"},
        {"type": "mrkdwn", "text": f"*Endpoint*\n{method} {path}"},
        {"type": "mrkdwn", "text": f"*Status*\n{status_code}"},
        {"type": "mrkdwn", "text": f"*Errors (last 5 min)*\n{errors_in_window}"},
        {"type": "mrkdwn", "text": f"*Latency (ms)*\n{latency_ms:.1f}"},
        {"type": "mrkdwn", "text": f"*Region*\n{os.getenv('FLY_REGION', '-')}"},
        {"type": "mrkdwn", "text": f"*Machine*\n{os.getenv('FLY_MACHINE_ID', '-')}"},
        {"type": "mrkdwn", "text": f"*Request ID*\n{request_id}"},
        {"type": "mrkdwn", "text": f"*Time (UTC)*\n{datetime.now(timezone.utc).isoformat()}"},
        {"type": "mrkdwn", "text": f"*Repository*\n{REPOSITORY}"},
    ]
    return {
        "channel": channel,
        "text": summary,
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": summary},
            },
            {
                "type": "section",
                "fields": fields,
            },
        ],
    }


async def post_error_alert(
    method: str,
    path: str,
    status_code: int,
    latency_ms: float,
    request_id: str,
) -> bool:
    """Post a metric-only error alert card to the on-call Slack channel."""
    errors_in_window = _record_error(method, path)

    token = os.getenv("SLACK_BOT_TOKEN", "")
    channel = os.getenv("SLACK_ONCALL_ALERTS_CHANNEL_ID", "")
    if not token or not channel:
        logger.warning(
            "Slack alert skipped: SLACK_BOT_TOKEN / SLACK_ONCALL_ALERTS_CHANNEL_ID not configured"
        )
        return False

    try:
        cooldown = float(os.getenv("ALERT_COOLDOWN_SECONDS", "60"))
    except ValueError:
        cooldown = 60.0

    key = (method, path)
    last_sent = _last_alert_at.get(key, 0)
    if time.time() - last_sent < cooldown:
        return False

    payload = _build_alert_payload(
        method, path, status_code, latency_ms, request_id, errors_in_window
    )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                SLACK_API_URL,
                headers={"Authorization": f"Bearer {token}"},
                json=payload,
            )
        if response.status_code == 200 and response.json().get("ok") is True:
            _last_alert_at[key] = time.time()
            return True
        slack_error = ""
        try:
            slack_error = response.json().get("error", "")
        except Exception:
            pass
        logger.warning(
            "Slack alert failed: status=%s error=%s", response.status_code, slack_error
        )
        return False
    except Exception as e:
        logger.warning("Slack alert failed: %s", e)
        return False
