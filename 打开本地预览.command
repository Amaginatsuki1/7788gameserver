#!/bin/sh
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)" || exit 1
sh ./scripts/start-preview.sh "$@"
result=$?
if [ "$result" -ne 0 ]; then
  printf '\nPreview failed. Check the message above. Press Enter to close.\n'
  if [ -t 0 ]; then read -r answer; fi
fi
exit "$result"
