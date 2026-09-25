#!/usr/bin/env bash
# Reproducible built-in workflow checks, without installing application packages.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
if [[ "$(uname -s)" != Linux || "$(uname -m)" != x86_64 ]]; then
  printf '%s\n' 'This pinned installer supports Linux x86_64 (the CI runner platform).' >&2
  exit 2
fi
for command in curl sha256sum tar node; do command -v "$command" >/dev/null; done

readonly version='1.7.12'
# Official rhysd/actionlint release asset, not a checksum obtained from the download.
readonly checksum='8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8'
workdir="$(mktemp -d "${TMPDIR:-/tmp}/rocket-actionlint.XXXXXX")"
trap 'rm -rf "$workdir"' EXIT
archive="$workdir/actionlint.tar.gz"
curl --fail --location --silent --show-error --proto '=https' --proto-redir '=https' \
  --retry 2 --connect-timeout 15 --max-time 90 \
  "https://github.com/rhysd/actionlint/releases/download/v${version}/actionlint_${version}_linux_amd64.tar.gz" \
  --output "$archive"
printf '%s  %s\n' "$checksum" "$archive" | sha256sum --check
tar -xzf "$archive" --no-same-owner --no-same-permissions -C "$workdir" actionlint
binary="$workdir/actionlint"
"$binary" -version
# Scope is YAML, Actions schema, expressions, contexts, permissions and job DAGs.
# Optional shellcheck/pyflakes integrations are separate from this built-in gate.
"$binary" -color -shellcheck='' -pyflakes=''
node scripts/check-actionlint-fixtures.mjs "$binary"
printf '%s\n' 'WORKFLOW_LINT_PASS'
