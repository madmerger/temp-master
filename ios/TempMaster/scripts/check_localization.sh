#!/bin/bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
en="$root/TempMaster/Resources/Localization/en.lproj/Localizable.strings"
ja="$root/TempMaster/Resources/Localization/ja.lproj/Localizable.strings"

en_keys="$(mktemp)"
ja_keys="$(mktemp)"
referenced="$(mktemp)"
trap 'rm -f "$en_keys" "$ja_keys" "$referenced"' EXIT

sed -nE 's/^"([^"]+)".*/\1/p' "$en" | sort > "$en_keys"
sed -nE 's/^"([^"]+)".*/\1/p' "$ja" | sort > "$ja_keys"
if ! diff -u "$en_keys" "$ja_keys"; then
  echo "Localization key sets differ."
  exit 1
fi

python3 - "$root/TempMaster" > "$referenced" <<'PY'
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])
keys = set()
for path in root.rglob("*.swift"):
    source = path.read_text()
    for match in re.finditer(r'L10n\.(?:text|format)\(([^)]*)\)', source, re.S):
        keys.update(re.findall(r'"([A-Za-z][A-Za-z0-9_]*)"', match.group(1)))
    keys.update(re.findall(r'statusLine\("([A-Za-z][A-Za-z0-9_]*)"', source))
print("\n".join(sorted(keys)))
PY
missing="$(comm -23 "$referenced" "$en_keys")"
if [[ -n "$missing" ]]; then
  echo "Missing English localization keys:"
  printf '%s\n' "$missing"
  exit 1
fi

printf 'Localization check passed: %s English keys, %s Japanese keys, %s referenced keys.\n' \
  "$(wc -l < "$en_keys" | tr -d ' ')" \
  "$(wc -l < "$ja_keys" | tr -d ' ')" \
  "$(wc -l < "$referenced" | tr -d ' ')"
