#!/usr/bin/env python3
"""Compare legacy.json and ios.json against the frozen cases.json and emit comparison.json / comparison.md / traceability.md."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KNOWN_DIFF_CASES = {"TC-18"}  # spec.md 既知の仕様差 (Hub 3)


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def ledger_ids(ledger_md):
    ids = {}
    for line in ledger_md.splitlines():
        m = re.match(r"^\| ((?:L|B|V)-\d+) \| (.+?) \|", line)
        if m:
            ids[m.group(1)] = m.group(2).strip()
    return ids


def effective_status(case, case_result, allowed_results):
    status = case_result.get("overall")
    if status == "PASS":
        key_results = case_result.get("key_results") or {}
        if any(
            (key_results.get(key) or {}).get("result") not in allowed_results
            for key in case["expected"]
        ):
            return "FAIL"
    return status


def verdict(case, legacy, ios):
    targets = case["targets"]
    ios_targets = [t for t in targets if t.startswith("ios-")]
    legacy_targets = [t for t in targets if t.startswith("legacy-")]
    legacy_case = legacy.get(case["id"], {})
    ios_case = ios.get(case["id"], {})
    lo = effective_status(case, legacy_case, {"PASS", "RECORDED"}) if legacy_targets else None
    io = effective_status(case, ios_case, {"PASS"}) if ios_targets else None
    if legacy_targets and lo is None:
        lo = "MISSING"
    if ios_targets and io is None:
        io = "MISSING"
    if not ios_targets:
        return lo, io, "LEGACY_ONLY" if lo == "PASS" else "LEGACY_FAIL"
    if not legacy_targets:
        return lo, io, "IOS_ONLY_PASS" if io == "PASS" else f"IOS_ONLY_{io}"
    if lo == "PASS" and io == "PASS":
        return lo, io, "MATCH"
    if io in ("NOT_RUN", "N/A", "MISSING"):
        return lo, io, io
    if (
        lo == "PASS"
        and io == "FAIL"
        and case["id"] in KNOWN_DIFF_CASES
        and is_hub3_known_diff(case, legacy_case, ios_case)
    ):
        return lo, io, "KNOWN_DIFF"
    return lo, io, "MISMATCH"


def is_hub3_known_diff(case, legacy_case, ios_case):
    """spec.md 既知の仕様差: iOS Standalone は Hub 3 も収集する。"""
    key_results = ios_case.get("key_results", {})
    failing = {
        k
        for k in set(case["expected"]) | set(key_results)
        if (key_results.get(k) or {}).get("result") != "PASS"
    }
    if failing != {"meter_device_ids"}:
        return False
    legacy_ids = set(legacy_case["actual"]["meter_device_ids"])
    ios_ids = set(ios_case["actual"]["meter_device_ids"])
    extra = ios_ids - legacy_ids
    hub3 = {d["device_id"] for d in ios_case["actual"].get("extra_ids_all_hub3", []) if d.get("deviceType") == "Hub 3"}
    return legacy_ids <= ios_ids and bool(extra) and extra == hub3


def key_rows(case, legacy, ios):
    rows = []
    lk = legacy.get(case["id"], {}).get("key_results", {})
    ik = ios.get(case["id"], {}).get("key_results", {})
    for key in case.get("expected", {}):
        rows.append({
            "key": key,
            "expected": case["expected"][key],
            "legacy": lk.get(key, {}).get("result"),
            "legacy_actual": lk.get(key, {}).get("actual"),
            "ios": ik.get(key, {}).get("result"),
            "ios_actual": ik.get(key, {}).get("actual"),
        })
    return rows


def short(value, limit=60):
    text = json.dumps(value, ensure_ascii=False) if not isinstance(value, str) else value
    text = text.replace("|", "\\|").replace("\n", " ")
    return text if len(text) <= limit else text[: limit - 1] + "…"


def main():
    cases_doc = load(ROOT / "cases.json")
    legacy = load(sys.argv[1] if len(sys.argv) > 1 else ROOT / "results/legacy.json")
    ios = load(sys.argv[2] if len(sys.argv) > 2 else ROOT / "results/ios/ios.json")
    out_dir = Path(sys.argv[3]) if len(sys.argv) > 3 else ROOT / "report"
    ledger = ledger_ids((ROOT / "ledger.md").read_text(encoding="utf-8"))

    results = []
    for case in cases_doc["cases"]:
        lo, io, v = verdict(case, legacy, ios)
        results.append({
            "id": case["id"],
            "name": case["name"],
            "targets": case["targets"],
            "ledger": case.get("ledger", []),
            "legacy": lo,
            "ios": io,
            "verdict": v,
            "keys": key_rows(case, legacy, ios),
            "ios_notes": ios.get(case["id"], {}).get("notes", []),
        })

    counts = {}
    for r in results:
        counts[r["verdict"]] = counts.get(r["verdict"], 0) + 1
    (out_dir / "comparison.json").write_text(
        json.dumps({"counts": counts, "cases": results}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    md = ["# レガシー vs iOS 比較結果", "", "判定: MATCH = 両方が凍結済み期待値 (cases.json) に PASS。KNOWN_DIFF = spec.md「既知の仕様差」に該当する差分 (期待値は変更していない)。", ""]
    md.append("| 判定 | 件数 |\n|---|---|")
    md += [f"| {k} | {v} |" for k, v in sorted(counts.items())]
    md += ["", "| Case | 名前 | 対象 | レガシー | iOS | 判定 |", "|---|---|---|---|---|---|"]
    for r in results:
        md.append(f"| {r['id']} | {r['name']} | {', '.join(r['targets'])} | {r['legacy'] or '-'} | {r['ios'] or '-'} | {r['verdict']} |")
    md += ["", "## キー別の結果", ""]
    for r in results:
        md += [f"### {r['id']} {r['name']}", "", "| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |", "|---|---|---|---|---|---|"]
        for k in r["keys"]:
            md.append(
                f"| {k['key']} | {short(k['expected'])} | {k['legacy'] or '-'} | {short(k['legacy_actual'])} | {k['ios'] or '-'} | {short(k['ios_actual'])} |"
            )
        if r["ios_notes"]:
            md += [""] + [f"- iOS note: {n}" for n in r["ios_notes"]]
        md.append("")
    (out_dir / "comparison.md").write_text("\n".join(md), encoding="utf-8")

    covered = {}
    for r in results:
        for lid in r["ledger"]:
            covered.setdefault(lid, []).append(f"{r['id']}({r['verdict']})")
    tr = ["# トレーサビリティ (台帳 → テストケース)", "", "| 台帳 ID | 内容 | ケース (判定) |", "|---|---|---|"]
    for lid, desc in ledger.items():
        tr.append(f"| {lid} | {short(desc, 80)} | {', '.join(covered.get(lid, [])) or '未カバー (ユニットテスト側で確認)'} |")
    (out_dir / "traceability.md").write_text("\n".join(tr) + "\n", encoding="utf-8")
    print(json.dumps(counts, ensure_ascii=False))
    print("uncovered:", [lid for lid in ledger if lid not in covered])


if __name__ == "__main__":
    main()
