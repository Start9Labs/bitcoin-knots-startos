#!/bin/sh

set -e

cli="bitcoin-cli $1 $2 $3"

$cli restorewallet "coin" "$4"