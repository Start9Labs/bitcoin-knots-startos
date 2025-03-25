#!/bin/sh

set -e

if ! bitcoin-cli listwalletdir | jq -e '.wallets[] | select(.name == "coin")' &> /dev/null; then
	bitcoin-cli createwallet "coin" &> /dev/null
fi

if ! bitcoin-cli getwalletinfo &> /dev/null; then
    bitcoin-cli loadwallet coin &> /dev/null
fi

cat > input.json
ADDRESS=$(jq -r '.["address"]' input.json)
MESSAGE=$(jq -r '.["message"]' input.json)
rm input.json

SIG=$(bitcoin-cli signmessage "$ADDRESS" "$MESSAGE")

result="    {
    \"version\": \"0\",
    \"message\": \"Signature: $SIG\",
    \"value\": null,
    \"copyable\": true,
    \"qr\": false
}"

echo $result