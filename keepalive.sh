#!/bin/bash
while true; do
  if ! curl -s -o /dev/null -w "" http://127.0.0.1:3000 2>/dev/null; then
    echo "$(date) - Server down, restarting..." >> /tmp/keepalive.log
    cd /home/z/my-project && bun run start > /tmp/nextserver.log 2>&1 &
    sleep 8
  fi
  sleep 30
done
