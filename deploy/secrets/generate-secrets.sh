#!/usr/bin/env bash
# Generates the secrets pds/.env and appview/.env need. Run once now,
# keep the output file safe, paste values in on deploy day.
# Never commit the output file — deploy/secrets/generated-secrets.env is gitignored.
set -euo pipefail

out="$(dirname "$0")/generated-secrets.env"

pds_jwt_secret=$(openssl rand -hex 16)
pds_admin_password=$(openssl rand -base64 24)
pds_plc_rotation_key=$(openssl ecparam -name secp256k1 -genkey -noout -outform DER | tail -c +8 | head -c 32 | xxd -p -c 32)
appview_admin_token=$(openssl rand -hex 32)

cat > "$out" <<EOF
# Generated $(date -u +%Y-%m-%dT%H:%M:%SZ). Do not commit.

# -> pds/.env
PDS_JWT_SECRET=${pds_jwt_secret}
PDS_ADMIN_PASSWORD=${pds_admin_password}
PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX=${pds_plc_rotation_key}

# -> appview/.env
APPVIEW_ADMIN_TOKEN=${appview_admin_token}
EOF

chmod 600 "$out"
echo "Wrote $out"
