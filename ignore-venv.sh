#!/usr/bin/env bash
set -euo pipefail

# Ensure .venv is ignored by git without duplicating the entry.
gitignore_file=".gitignore"
entry=".venv/"

touch "$gitignore_file"

if grep -Eq '^\.venv/?$' "$gitignore_file"; then
  echo "$gitignore_file already ignores $entry"
  exit 0
fi

printf "%s\n" "$entry" >> "$gitignore_file"
echo "Added $entry to $gitignore_file"
