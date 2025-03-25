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

AMOUNT=$(jq -r '.["amount"]' input.json)
if [ $AMOUNT = "null" ]; then
    AMOUNT="0"
fi

FEE=$(jq -r '.["fee"]' input.json)
if [ $FEE = "null" ]; then
    FEE="0"
fi

TXID=$(bitcoin-cli -named sendtoaddress address=$ADDRESS amount=$AMOUNT fee_rate=$FEE)

result="    {
    \"version\": \"0\",
    \"message\": \"txid: $TXID\",
    \"value\": null,
    \"copyable\": true,
    \"qr\": false
}"

echo $result