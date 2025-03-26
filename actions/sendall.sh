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

FEE=$(jq -r '.["fee"]' input.json)
if [ $FEE = "null" ]; then
    FEE="0"
fi

TXID=$(bitcoin-cli -named sendall recipients="[\"$ADDRESS\"]" fee_rate=$FEE | jq -r '.txid')

result="    {
    \"version\": \"0\",
    \"message\": \"txid: $TXID\",
    \"value\": null,
    \"copyable\": true,
    \"qr\": false
}"

echo $result