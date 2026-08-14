#!/usr/bin/env bash
echo "HOME=$HOME"
for c in node npm npx python python3 curl nohup seq mktemp install lsof netstat grep sed cut awk node.exe; do
  printf '%-10s ' "$c"
  if command -v "$c" >/dev/null 2>&1; then
    echo "OK  $(command -v "$c")"
  else
    echo "MISSING"
  fi
done
echo "---versions---"
node -v
printf 'claude: '
command -v claude >/dev/null 2>&1 && claude --version || echo "MISSING"