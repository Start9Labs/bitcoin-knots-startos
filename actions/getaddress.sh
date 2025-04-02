#!/bin/sh

set -e

if ! bitcoin-cli listwalletdir | jq -e '.wallets[] | select(.name == "coin")' &> /dev/null; then
	bitcoin-cli createwallet "coin" &> /dev/null
fi

if ! bitcoin-cli getwalletinfo &> /dev/null; then
    bitcoin-cli loadwallet coin &> /dev/null
fi

ADDRESS=$(bitcoin-cli getnewaddress "" "bech32")

result="    {
    \"version\": \"0\",
    \"message\": \"$ADDRESS\",
    \"value\": null,
    \"copyable\": true,
    \"qr\": false
}"

echo $result