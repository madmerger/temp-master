#!/usr/bin/env python3
"""Render report.md (+ comparison.json / traceability.md) to report.html and report.pdf."""
import json
import subprocess
import sys
from pathlib import Path

import markdown

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SCREEN_CASES = ["TC-01", "TC-05", "TC-09", "TC-22"]


def case_table(data):
    rows = ["| Case | 名前 | レガシー | iOS | 判定 |", "|---|---|---|---|---|"]
    for c in data["cases"]:
        mark = c["verdict"] if c["verdict"] != "KNOWN_DIFF" else "**KNOWN_DIFF**"
        rows.append(f"| {c['id']} | {c['name']} | {c['legacy'] or '-'} | {c['ios'] or '-'} | {mark} |")
    return "\n".join(rows)


def screens(data):
    names = {c["id"]: c["name"] for c in data["cases"]}
    out = []
    for cid in SCREEN_CASES:
        legacy = ROOT / f"results/legacy_screens/{cid}.png"
        ios = ROOT / f"results/ios/ios_screens/{cid}.png"
        out.append(
            f'<div class="pair"><h4>{cid} {names[cid]}</h4>'
            f'<div class="imgs"><figure><img class="web" src="{legacy.as_uri()}"><figcaption>レガシー Web</figcaption></figure>'
            f'<figure><img class="ios" src="{ios.as_uri()}"><figcaption>iOS</figcaption></figure></div></div>'
        )
    return "\n".join(out)


CSS = """
@page { size: A4; margin: 14mm 12mm; }
body { font-family: 'Noto Sans CJK JP', 'Noto Sans JP', sans-serif; font-size: 9.5pt; line-height: 1.5; color: #222; }
h1 { font-size: 18pt; border-bottom: 3px solid #2b6cb0; padding-bottom: 4px; }
h2 { font-size: 13pt; color: #2b6cb0; margin-top: 18px; border-bottom: 1px solid #cbd5e0; }
h3 { font-size: 11pt; }
table { border-collapse: collapse; width: 100%; margin: 6px 0 10px; font-size: 8.5pt; page-break-inside: auto; }
tr { page-break-inside: avoid; }
th, td { border: 1px solid #cbd5e0; padding: 3px 5px; vertical-align: top; }
th { background: #edf2f7; }
code { font-size: 8pt; background: #f4f4f4; padding: 0 2px; }
.pair { page-break-inside: avoid; margin-bottom: 10px; }
.imgs { display: flex; gap: 10px; align-items: flex-start; }
figure { margin: 0; text-align: center; }
figcaption { font-size: 8pt; color: #555; }
img.web { width: 105mm; border: 1px solid #ccc; }
img.ios { height: 88mm; border: 1px solid #ccc; }
"""


def main():
    data = json.loads((HERE / "comparison.json").read_text(encoding="utf-8"))
    trace = (HERE / "traceability.md").read_text(encoding="utf-8").split("\n", 2)[2]
    md = (HERE / "report.md").read_text(encoding="utf-8")
    md = md.replace("{{CASE_TABLE}}", case_table(data)).replace("{{TRACE_TABLE}}", trace).replace("{{SCREENS}}", screens(data))
    body = markdown.markdown(md, extensions=["tables"])
    html = f"<!doctype html><html lang='ja'><head><meta charset='utf-8'><style>{CSS}</style></head><body>{body}</body></html>"
    out_html = HERE / "report.html"
    out_html.write_text(html, encoding="utf-8")
    chrome = sys.argv[1] if len(sys.argv) > 1 else "google-chrome"
    subprocess.run([chrome, "--headless", "--no-sandbox", "--disable-gpu", "--allow-file-access-from-files",
                    "--no-pdf-header-footer", f"--print-to-pdf={HERE / 'report.pdf'}", out_html.as_uri()], check=True,
                   capture_output=True)
    print(HERE / "report.pdf")


if __name__ == "__main__":
    main()
