import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const root = process.cwd()
const resultPath = resolve(root, 'test-results/results.json')
const scratchPath = resolve(root, '.e2e-report-work')
const htmlPath = join(scratchPath, 'report.html')
const pdfPath = resolve(root, '../docs/e2e-report.pdf')
const screenshotDirectory = resolve(root, 'e2e-artifacts/screenshots')
const screenshotCaptions = {
  light: 'ライトテーマのダッシュボード',
  dark: 'ダークテーマのダッシュボード',
  'stale-meters': '未更新メーターのセクション',
  'error-state': 'APIエラーと接続状態',
}
const scenarioDescriptions = {
  '初期表示 / Initial dashboard': 'タイトル、接続状態、初回ローディング、ステータスバーとフッターを確認',
  'メーターカード描画 / Meter cards': '表示名マッピング、未知名の表示、測定値、機器種別、履歴チャートを確認',
  'タイムスケール切替 / History time scales': '各時間範囲の履歴要求と、未更新メーターが除外されることを確認',
  'ダークテーマ / Theme preference and persistence': 'OS設定連動、ライト/ダーク切替、永続化、背景色を確認',
  '古いメーターのセクション / Stale meter cards': '1週間以上未更新の表示、空データ表示、履歴要求除外を確認',
  'meters API エラー / Meters request error': 'メーターAPI失敗時のエラー表示と切断状態を確認',
  'status API エラー / Status request error': 'ステータスAPI失敗時のエラー表示と切断状態を確認',
  'refresh API エラー / Refresh request error': '更新API失敗時の専用エラー表示を確認',
  'レート制限の警告 / Rate limit warning': 'バックオフ残り時間のレート制限警告を確認',
  '手動更新・バックアップ・自動更新 / Refresh, backup and auto refresh': '更新POSTと再取得、更新中ボタン、バックアップURL、30秒間隔を確認',
  '新しい dashboard reload が古い応答に上書きされない / Newer reload wins over a stale response': '並行リロードで遅れて到着した古い応答が新しいメーター値を上書きしないことを確認',
}

if (!existsSync(resultPath)) {
  throw new Error(`Playwright JSON report not found: ${resultPath}`)
}

const report = JSON.parse(readFileSync(resultPath, 'utf8'))
const require = createRequire(import.meta.url)
const playwrightPackage = require('@playwright/test/package.json')
const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function flattenSuites(suites, parent = []) {
  const rows = []
  for (const suite of suites ?? []) {
    const suitePath = suite.title ? [...parent, suite.title] : parent
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const results = test.results ?? []
        const lastResult = results.at(-1)
        let status = lastResult?.status ?? test.status ?? 'skipped'
        if (results.some((result) => result.status === 'failed' || result.status === 'timedOut')) {
          status = 'failed'
        } else if (results.length && results.every((result) => result.status === 'skipped')) {
          status = 'skipped'
        }
        rows.push({
          suite: suitePath.join(' / ') || spec.file || '',
          title: spec.title,
          status,
          duration: results.reduce((sum, result) => sum + (result.duration ?? 0), 0),
        })
      }
    }
    rows.push(...flattenSuites(suite.suites, suitePath))
  }
  return rows
}

const tests = flattenSuites(report.suites)
const totals = {
  total: tests.length,
  passed: tests.filter((test) => test.status === 'passed').length,
  failed: tests.filter((test) => test.status === 'failed' || test.status === 'timedOut').length,
  skipped: tests.filter((test) => test.status === 'skipped').length,
  duration: report.stats?.duration ?? tests.reduce((sum, test) => sum + test.duration, 0),
}
const browser = await chromium.launch()
const browserVersion = browser.version()
const screenshots = Object.entries(screenshotCaptions)
  .map(([name, caption]) => {
    const filePath = join(screenshotDirectory, `${name}.png`)
    if (!existsSync(filePath)) {
      return null
    }
    const image = readFileSync(filePath).toString('base64')
    return `<figure><img src="data:image/png;base64,${image}" alt="${escapeHtml(caption)}"><figcaption>${escapeHtml(caption)}</figcaption></figure>`
  })
  .filter(Boolean)
const scenarioRows = tests.map(({ title }) => `<li><strong>${escapeHtml(title)}</strong> — ${escapeHtml(scenarioDescriptions[title] ?? title)}</li>`).join('')
const testRows = tests.map((test) => `
  <tr>
    <td>${escapeHtml(test.suite)}</td>
    <td>${escapeHtml(test.title)}</td>
    <td class="status ${escapeHtml(test.status)}">${escapeHtml(test.status)}</td>
    <td>${(test.duration / 1000).toFixed(2)} 秒</td>
  </tr>`).join('')

const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>SwitchBot Temp Master Dashboard E2E テストレポート</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #1f2937; font: 12px/1.6 "Noto Sans CJK JP", "Noto Sans JP", sans-serif; }
    h1 { margin: 0 0 8px; color: #123b62; font-size: 24px; }
    h2 { margin: 18px 0 7px; border-bottom: 2px solid #dbeafe; padding-bottom: 5px; color: #123b62; font-size: 17px; }
    .meta, .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7px 20px; }
    .summary { grid-template-columns: repeat(5, 1fr); margin-top: 15px; }
    .tile { border: 1px solid #dbe3ec; border-radius: 6px; padding: 9px; background: #f8fafc; }
    .tile strong { display: block; color: #123b62; font-size: 17px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #d5dde5; padding: 4px 7px; text-align: left; vertical-align: top; }
    th { background: #eff6ff; }
    .status { font-weight: bold; text-transform: capitalize; }
    .passed { color: #15803d; } .failed, .timedOut { color: #b91c1c; } .skipped { color: #a16207; }
    figure { margin: 12px 0 22px; page-break-inside: avoid; }
    figure img { display: block; width: 100%; max-height: 155mm; object-fit: contain; border: 1px solid #d1d5db; }
    figcaption { margin-top: 4px; text-align: center; color: #4b5563; }
    li { margin: 2px 0; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <h1>SwitchBot Temp Master Dashboard E2E テストレポート</h1>
  <h2>実行日時 / 環境</h2>
  <div class="meta">
    <div>実行日時: ${escapeHtml(new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }))}</div>
    <div>Node.js: ${escapeHtml(process.version)}</div>
    <div>Playwright: ${escapeHtml(playwrightPackage.version)}</div>
    <div>Browser: Chromium ${escapeHtml(browserVersion)}</div>
    <div>Commit SHA: ${escapeHtml(commit)}</div>
  </div>
  <h2>サマリ</h2>
  <div class="summary">
    <div class="tile">合計<strong>${totals.total}</strong></div>
    <div class="tile">成功<strong>${totals.passed}</strong></div>
    <div class="tile">失敗<strong>${totals.failed}</strong></div>
    <div class="tile">スキップ<strong>${totals.skipped}</strong></div>
    <div class="tile">所要時間<strong>${(totals.duration / 1000).toFixed(1)} 秒</strong></div>
  </div>
  <h2>テスト一覧</h2>
  <table><thead><tr><th>スイート</th><th>テスト</th><th>結果</th><th>所要時間</th></tr></thead><tbody>${testRows}</tbody></table>
  <h2>カバーしたシナリオ</h2>
  <ul>${scenarioRows}</ul>
  <h2 class="page-break">スクリーンショット</h2>
  ${screenshots.join('\n')}
</body>
</html>`

mkdirSync(dirname(pdfPath), { recursive: true })
mkdirSync(scratchPath, { recursive: true })
writeFileSync(htmlPath, html)
const page = await browser.newPage()
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' })
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' },
})
await browser.close()

console.log(`HTML report: ${htmlPath}`)
console.log(`PDF report: ${pdfPath}`)
console.log(`Tests: ${totals.passed}/${totals.total} passed, ${totals.failed} failed, ${totals.skipped} skipped`)
