#!/bin/bash
# Bot va vaqtinchalik https manzil.
# Noutbuk yonganda launchd shu skriptni ochadi. Tunnel uzilsa o'zi yangisini oladi.
set -u
ROOT="/Users/raxmonovichdev/Podcast proekt"
BIN="$HOME/Library/Application Support/podcast-proekt/bin"
LOG="$HOME/Library/Logs/english-podcast-tunnel.log"
cd "$ROOT"

CF_PID=""
BOT_PID=""

stop_children() {
  if [ -n "$BOT_PID" ]; then
    kill "$BOT_PID" 2>/dev/null || true
    wait "$BOT_PID" 2>/dev/null || true
  fi
  if [ -n "$CF_PID" ]; then
    kill "$CF_PID" 2>/dev/null || true
    wait "$CF_PID" 2>/dev/null || true
  fi
  BOT_PID=""
  CF_PID=""
}

on_signal() {
  stop_children
  exit 0
}
trap on_signal TERM INT

write_url() {
  ROOT="$ROOT" URL="$1" "$ROOT/.venv/bin/python" - <<'PY'
import os
from pathlib import Path
root = Path(os.environ["ROOT"])
url = os.environ["URL"]
path = root / ".env"
lines = path.read_text().splitlines()
out = []
found = False
for line in lines:
    if line.startswith("WEBAPP_URL="):
        out.append("WEBAPP_URL=" + url)
        found = True
    else:
        out.append(line)
if not found:
    out.append("WEBAPP_URL=" + url)
path.write_text("\n".join(out) + "\n")
print(url)
PY
}

# Tunnel logida "Registered" dan keyin "Tunnel not found" bo'lsa, manzil o'lik.
tunnel_dead() {
  if [ -z "$CF_PID" ] || ! kill -0 "$CF_PID" 2>/dev/null; then
    return 0
  fi
  awk '
    /Registered tunnel connection/ { seen = 1; dead = 0 }
    /Tunnel not found/ { if (seen) dead = 1 }
    END { exit (dead ? 0 : 1) }
  ' "$LOG"
}

start_tunnel() {
  : > "$LOG"
  "$BIN/cloudflared" tunnel --url http://127.0.0.1:5173 --no-autoupdate >> "$LOG" 2>&1 &
  CF_PID=$!
  URL=""
  i=0
  while [ "$i" -lt 40 ]; do
    # api.trycloudflare.com xato satrida ham chiqadi. Haqiqiy tunnel boshqa nomda bo'ladi.
    URL=$(grep -oE 'https://[-a-zA-Z0-9]+\.trycloudflare\.com' "$LOG" | grep -v 'https://api.trycloudflare.com' | head -1 || true)
    if [ -n "$URL" ]; then
      return 0
    fi
    if ! kill -0 "$CF_PID" 2>/dev/null; then
      CF_PID=""
      return 1
    fi
    i=$((i + 1))
    sleep 0.5
  done
  kill "$CF_PID" 2>/dev/null || true
  wait "$CF_PID" 2>/dev/null || true
  CF_PID=""
  return 1
}

start_bot() {
  "$ROOT/.venv/bin/python" -u "$ROOT/bot/main.py" &
  BOT_PID=$!
}

while true; do
  stop_children
  URL=""
  opened=0
  # Noutbuk yangi yonganda DNS kechikishi mumkin.
  for _attempt in 1 2 3 4 5 6 7 8; do
    if start_tunnel; then
      opened=1
      break
    fi
    sleep 3
  done

  if [ "$opened" -eq 1 ]; then
    write_url "$URL"
    start_bot
    while kill -0 "$BOT_PID" 2>/dev/null && ! tunnel_dead; do
      sleep 15
    done
    echo "Tunnel yoki bot to'xtadi. Qayta ochiladi."
  else
    echo "Tunnel ochilmadi. 15 soniyadan so'ng qayta uriniladi."
    sleep 15
  fi
done
