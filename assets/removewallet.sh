#!/bin/sh

set -e

cli="bitcoin-cli $1 $2 $3"

if $cli getwalletinfo &> /dev/null; then
    $cli unloadwallet coin &> /dev/null
fi

rm -rf "$4"