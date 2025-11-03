#!/bin/bash

set -euo pipefail

CONFIG_FILE="/root/.bitcoin/start9/config.yaml"
export EMBASSY_IP=$(ip -4 route list match 0/0 | awk '{print $3}')
export PEER_TOR_ADDRESS=$(yq e '.peer-tor-address' "$CONFIG_FILE")
export RPC_TOR_ADDRESS=$(yq e '.rpc-tor-address' "$CONFIG_FILE")

# Umbrel UI
export BITCOIND_EXTERNAL_MODE=true
export BITCOIND_IP=127.0.0.1
export RPC_PORT=8332
export RPC_USER=$(yq e '.rpc.username' "$CONFIG_FILE")
export RPC_PASS=$(yq e '.rpc.password' "$CONFIG_FILE")

(cd /umbrel-bitcoin && node dist/server.js > /dev/null 2>&1 &)

exec tini -p SIGTERM -- bitcoind-manager
