#!/usr/bin/env bash
set -euo pipefail

readonly expected_repo='xuan2261/Rocket-Anatomy-Lab'
repo="${GITHUB_REPOSITORY:-}"
subject="${SITE_ATTESTATION_SUBJECT:-}"
sha="${SITE_SHA:-}"
source_ref="${SITE_SOURCE_REF:-}"

[[ "$repo" == "$expected_repo" ]] || { printf '%s\n' 'ATTESTATION_CONTEXT_REJECTED: repository' >&2; exit 2; }
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || { printf '%s\n' 'ATTESTATION_CONTEXT_REJECTED: sha' >&2; exit 2; }
[[ "$source_ref" == 'refs/heads/main' ]] || { printf '%s\n' 'ATTESTATION_CONTEXT_REJECTED: source ref' >&2; exit 2; }
[[ -n "${GH_TOKEN:-}" ]] || { printf '%s\n' 'ATTESTATION_CONTEXT_REJECTED: token' >&2; exit 2; }
[[ -f "$subject" && ! -L "$subject" ]] || { printf '%s\n' 'ATTESTATION_CONTEXT_REJECTED: subject' >&2; exit 2; }
command -v gh >/dev/null || { printf '%s\n' 'ATTESTATION_CONTEXT_REJECTED: gh unavailable' >&2; exit 2; }

gh attestation verify "$subject" \
  --repo "$repo" \
  --signer-workflow "$repo/.github/workflows/ci.yml" \
  --source-ref "$source_ref" \
  --source-digest "$sha" \
  --predicate-type 'https://slsa.dev/provenance/v1' \
  --deny-self-hosted-runners

printf 'SITE_ATTESTATION_PASS %s %s\n' "$sha" "$subject"
