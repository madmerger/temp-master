#!/usr/bin/env python3
"""Scan E2E deliverables/code without ever displaying credential values."""
import os
from pathlib import Path
import re
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
paths = [root / "TempMasterE2ETests", root / "e2e-results",
         root / "project.yml", root / "scripts"]
secrets = {name: value.encode() for name, value in os.environ.items()
           if value and (name.startswith("SWITCHBOT_") or "FLY" in name and
                         any(part in name for part in ("TOKEN", "SECRET", "KEY")))}
patterns = {
    "fly_token": rb"\b(?:FlyV1|fm2_)[A-Za-z0-9_,+/=-]{20,}",
    "github_token": rb"\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})",
    "bearer_literal": rb"(?i)bearer\s+[A-Za-z0-9_.+/=-]{24,}",
    "private_key": rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    "credential_literal": rb"""(?i)(?:SWITCHBOT_(?:TOKEN|SECRET)(?:_2)?|FLY_API_TOKEN)\s*=\s*["']?[A-Za-z0-9_+/=-]{24,}""",
}
files = sorted({f for path in paths for f in
                (path.rglob("*") if path.is_dir() else [path]) if f.is_file()})
if secrets:
    # Patterns go over stdin, not argv/history; -l emits filenames, never values.
    grep = subprocess.run(["grep", "-a", "-F", "-l", "-f", "-", "--", *map(str, files)],
                          input=b"\n".join(secrets.values()) + b"\n", capture_output=True)
    if grep.returncode not in (0, 1):
        raise RuntimeError("Secret grep failed; do not treat this as clean.")
    print(f"Exact-value grep matching files: {len(grep.stdout.splitlines())}")
findings = []
for file in files:
    data = file.read_bytes()
    for name, value in secrets.items():
        if value in data:
            findings.append((str(file.relative_to(root)), f"exact-env:{name}"))
    for name, pattern in patterns.items():
        if re.search(pattern, data):
            findings.append((str(file.relative_to(root)), name))
print(f"Files scanned: {len(files)}")
print("Secret names checked: " + ", ".join(sorted(secrets)))
print(f"Common token patterns checked: {len(patterns)}")
print(f"Findings: {len(findings)}")
for file, rule in findings:
    print(f"{file}: {rule} (value redacted)")
sys.exit(bool(findings))
