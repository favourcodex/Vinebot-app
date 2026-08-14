#!/usr/bin/env bash
set -e
echo "python3 shim:"; python3 --version
nohup python3 -m http.server 8787 >/tmp/httptest.log 2>&1 &
sleep 2
echo "lsof -ti tcp:8787 ->"; lsof -ti tcp:8787
pid=$(lsof -ti tcp:8787 | head -1)
echo "killing $pid"; kill "$pid"
sleep 1
echo "after kill ->"; lsof -ti tcp:8787 | wc -l
echo "ok"