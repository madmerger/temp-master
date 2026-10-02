#!/usr/bin/env bash
# Key-parity check: every .lproj must have exactly the same keys as en.lproj,
# for both Localizable.strings and Localizable.stringsdict.
set -euo pipefail

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../TempMaster/Resources/Localization" && pwd)"

keys_strings() { grep -oE '^"[^"]+"[[:space:]]*=' "$1" | sed -E 's/[[:space:]]*=$//' | sort -u; }
keys_dict() { grep -oE '<key>[^<]+</key>' "$1" | sed -E 's:</?key>::g' | sort -u; }

status=0

base=$(keys_strings "$dir/en.lproj/Localizable.strings")
for f in "$dir"/*.lproj/Localizable.strings; do
  [ "$f" = "$dir/en.lproj/Localizable.strings" ] && continue
  if ! d=$(diff <(echo "$base") <(keys_strings "$f")); then
    echo "Localizable.strings key mismatch in $f (< missing, > extra):"
    echo "$d"
    status=1
  fi
done

# stringsdict: compare top-level localization keys only (keys that sit directly
# under <dict> and have a sibling <key>NSStringLocalizedFormatKey</key>)
dict_keys() {
  awk '/<key>[^<]+<\/key>/{k=$0} /NSStringLocalizedFormatKey/{print k}' "$1" \
    | sed -E 's:</?key>::g;s/^[[:space:]]+//;s/[[:space:]]+$//' | sort -u
}
base=$(dict_keys "$dir/en.lproj/Localizable.stringsdict")
for f in "$dir"/*.lproj/Localizable.stringsdict; do
  [ "$f" = "$dir/en.lproj/Localizable.stringsdict" ] && continue
  if ! d=$(diff <(echo "$base") <(dict_keys "$f")); then
    echo "Localizable.stringsdict key mismatch in $f (< missing, > extra):"
    echo "$d"
    status=1
  fi
done

if [ "$status" -eq 0 ]; then
  echo "Localization key parity OK"
fi
exit $status
