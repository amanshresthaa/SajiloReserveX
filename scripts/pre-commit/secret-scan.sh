#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel)

if ! command -v gitleaks >/dev/null 2>&1; then
  cat <<'MSG' >&2
[gitleaks] CLI not found. Install via `brew install gitleaks`, `choco install gitleaks`,
or download from https://github.com/gitleaks/gitleaks/releases.
MSG
  exit 1
fi

if ! command -v trufflehog >/dev/null 2>&1; then
  cat <<'MSG' >&2
[trufflehog] CLI not found. Install via `brew install trufflehog`, `pipx install trufflehog`,
or see https://github.com/trufflesecurity/trufflehog for binaries.
MSG
  exit 1
fi

echo "[secret-scan] Running gitleaks protect on staged changes..."
gitleaks protect --staged --redact --no-banner --log-level warn

echo "[secret-scan] Running trufflehog filesystem scan..."
trufflehog filesystem --no-update --only-verified --fail "$ROOT_DIR"
