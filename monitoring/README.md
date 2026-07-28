# Data freshness monitoring

This monitor checks the external Snakeroom backend (`https://snakeroom.fly.dev`)
every 30 minutes from GitHub Actions. It evaluates the meter timestamps and
status fields rather than only checking whether the HTTP request returns 200.

The dashboard URL used in notifications is
`https://temp-master.fly.dev/`; the Snakeroom URL is the data provider.

## Thresholds

- Newest meter data older than 1 hour: `WARN`
- Newest meter data older than 24 hours: `CRITICAL`
- No meters, invalid configuration, or no valid timestamps: `CRITICAL`
- `last_api_call` older than three collection intervals: `CRITICAL`
- API rate limiting: `WARN`
- An individual meter more than 24 hours behind the newest meter is recorded as
  information in `lagging_meters`, but does not change severity. The dashboard
  already separates those meters into its stale-meter section.

The effective WARN threshold is the larger of `--warn-hours` and five times
the reported collection interval, capped at the CRITICAL threshold. This
prevents a slower data source cadence from generating premature WARN alerts.

The defaults can be changed with the script's CLI flags:
`--warn-hours`, `--critical-hours`, and `--lag-hours`. The
`--collection-interval` value is only a fallback in seconds; the
`collection_interval` reported by `/api/status` takes precedence.

## Notifications and deduplication

`.github/workflows/monitor.yml` stores the incident state in an open GitHub
Issue labelled `data-stale`. A new unhealthy result creates one issue and
posts one Slack notification. Further unhealthy runs do not notify again.
When the result becomes healthy, the workflow comments a recovery message,
closes the issue, and posts a recovery notification.

The notified severity is recorded with `severity:WARN` or
`severity:CRITICAL`. A WARN-to-CRITICAL escalation adds an issue comment and
Slack notification; CRITICAL-to-WARN de-escalation is intentionally silent but
updates the severity label, so a later re-escalation can notify again.
Slack delivery failures or a missing webhook leave the `slack-pending` label so
later unhealthy runs retry delivery.

Set the repository secret `SLACK_WEBHOOK_URL` to enable Slack notifications.
If it is not set, the workflow logs a warning and continues successfully.

Incoming Slack webhooks cannot reply in a thread. Recovery is therefore a
separate Slack message that references the GitHub Issue; it is not a threaded
reply to the original alert. Recovery duration is measured from issue creation,
so `停止時間（概算）` can differ from the actual outage by up to the monitor
interval at either end.

## 今後の課題

現在は1回の不健全なチェックだけで通知します。ノイズが問題になる場合は、
不健全な判定を2回連続で確認してから通知する方式も検討できます。

## Running locally

```bash
python monitoring/check_data_freshness.py
python monitoring/check_data_freshness.py --api-base https://snakeroom.fly.dev
python -m pytest monitoring/tests
```

Use the **workflow_dispatch** button on the GitHub Actions page to run the
monitor immediately without waiting for the scheduled 30-minute interval.
