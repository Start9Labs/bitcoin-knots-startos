#!/bin/sh

set -e

cat > input.json

URL=$(jq -r '.["location"]' input.json)

rm input.json

download_and_load() {
    mkdir -p /tmp/snap
    rm -rf /tmp/snap/snapshot
    wget -q $URL -O /tmp/snap/snapshot
    bitcoin-cli loadtxoutset /tmp/snap/snapshot
}

download_and_load &

result="    {
            \"version\": \"0\",
            \"message\": \"Consult the logs to see if the snapshot the progression. Do not restart knots until the snapshot is loaded. If the snapshot is invalid nothing will happen.\",
            \"value\": null,
            \"copyable\": false,
            \"qr\": false
        }"

echo $result
