#!/bin/bash
while true; do
  cd /home/z/my-project
  bun run start > /tmp/nextserver.log 2>&1 &
  PID=$!
  sleep 6
  for i in $(seq 1 300); do
    if ! kill -0 $PID 2>/dev/null; then break; fi
    sleep 3
  done
  kill $PID 2>/dev/null
  sleep 2
done
