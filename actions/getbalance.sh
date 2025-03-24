#!/bin/sh

set -e

if ! bitcoin-cli listwalletdir | jq -e '.wallets[] | select(.name == "coin")' &> /dev/null; then
	bitcoin-cli createwallet "coin" &> /dev/null
fi

if ! bitcoin-cli getwalletinfo &> /dev/null; then
    bitcoin-cli loadwallet coin &> /dev/null
fi

TRUSTED=$(bitcoin-cli getbalances | jq -r '.mine.trusted')
UNTRUSTED=$(bitcoin-cli getbalances | jq -r '.mine.untrusted_pending')
IMMATURE=$(bitcoin-cli getbalances | jq -r '.mine.immature')

result="    {
    \"version\": \"0\",
    \"message\": \"Your wallet balance: $TRUSTED BTC. /
    Non confirmed balance: $UNTRUSTED BTC. /
    Immanture balance from mining: $IMMATURE BTC.\",
    \"value\": null,
    \"copyable\": true,
    \"qr\": false
}"

echo $result