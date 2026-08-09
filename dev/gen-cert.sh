#!/usr/bin/env bash
# Generate or regenerate mkcert certificates for all local network IPs.
# Run automatically before `npm run dev` via the predev script.
set -e

CERT_DIR=".dev-certs"
CERT_FILE="$CERT_DIR/localhost.pem"
KEY_FILE="$CERT_DIR/localhost-key.pem"

mkdir -p "$CERT_DIR"

# Collect all local IPv4 addresses (exclude loopback, docker, link-local)
IPS=$(ip -4 addr show 2>/dev/null \
  | grep -oP 'inet \K[\d.]+' \
  | grep -v '^127\.' \
  | grep -v '^169\.254\.' \
  | grep -v '^172\.(1[6-9]|2[0-9]|3[01])\.' \
  | sort -u)

# Build the list of names: localhost + ::1 + all local IPs + full 192.168.0.x and 192.168.1.x ranges
NAMES=("localhost" "127.0.0.1" "::1")
for ip in $IPS; do
  NAMES+=("$ip")
done
for i in $(seq 0 255); do
  NAMES+=("192.168.0.$i" "192.168.1.$i")
done

# Check if cert already exists and covers all current IPs
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
  EXISTING=$(openssl x509 -noout -text -in "$CERT_FILE" 2>/dev/null | grep -oP 'IP Address:\K[\d.]+' | sort -u)
  MISSING=0
  for ip in $IPS; do
    if ! echo "$EXISTING" | grep -q "^${ip}$"; then
      MISSING=1
      break
    fi
  done
  if [ "$MISSING" -eq 0 ]; then
    echo "[gen-cert] Certificate already covers all local IPs, skipping."
    exit 0
  fi
  echo "[gen-cert] IP changed, regenerating certificate..."
fi

# Generate the certificate
mkcert -cert-file "$CERT_FILE" -key-file "$KEY_FILE" "${NAMES[@]}" 2>&1 | sed 's/^/[gen-cert] /'

echo "[gen-cert] Certificate generated for: ${NAMES[*]}"
