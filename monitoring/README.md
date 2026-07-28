# Data freshness monitoring

This monitor checks the external Snakeroom backend (`https://snakeroom.fly.dev`)
every 30 minutes from GitHub Actions. It evaluates the meter timestamps and
status fields rather than only checking whether the HTTP request returns 200.

## Thresholds

- Newest meter data older than 1 hour: `WARN`
- Newest meter data older than 24 hours: `CRITICAL`
- No meters, invalid configuration, or no valid timestamps: `CRITICAL`
- `last_api_call` older than three collection intervals: `CRITICAL`
- API rate limiting: `WARN`
- An individual meter more than 24 hours behind the newest meter: `WARN`

The defaults can be changed with the script's CLI flags:
`--warn-hours`, `--critical-hours`, `--lag-hours`, and
`--collection-interval`.

## Notifications and deduplication

`.github/workflows/monitor.yml` stores the incident state in an open GitHub
Issue labelled `data-stale`. A new unhealthy result creates one issue and
posts one Slack notification. Further unhealthy runs do not notify again.
When the result becomes healthy, the workflow comments a recovery message,
closes the issue, and posts a recovery notification.

Set the repository secret `SLACK_WEBHOOK_URL` to enable Slack notifications.
If it is not set, the workflow logs a warning and continues successfully.

Incoming Slack webhooks cannot reply in a thread. Recovery is therefore a
separate Slack message that references the GitHub Issue; it is not a threaded
reply to the original alert.

## Running locally

```bash
python monitoring/check_data_freshness.py
python monitoring/check_data_freshness.py --api-base https://snakeroom.fly.dev
python -m pytest monitoring/tests
```

Use the **workflow_dispatch** button on the GitHub Actions page to run the
monitor immediately without waiting for the scheduled 30-minute interval.
