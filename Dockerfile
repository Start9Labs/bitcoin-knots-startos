# Build stage
FROM debian:stable-slim AS builder

ARG VERSION
ARG PATH_VERSION
ARG TARGETPLATFORM

WORKDIR /build

RUN apt-get update && apt-get install -y wget pgp ca-certificates

# Pinned Bitcoin Knots release signers. Each has signed recent Knots
# 29.x releases. Build requires REQUIRED_QUORUM valid signatures from
# this set; signatures from non-pinned signers are ignored. Adding a
# signer here is an explicit trust decision — do not delegate to
# upstream key directories or keyservers.
ENV PINNED_FINGERPRINTS="\
1A3E761F19D2CC7785C5502EA291A2C45D0C504A \
1D5889CB9E0564C154E18BB512EC9519DB43CC27 \
658E64021E5793C6C4E15E45C2E581F5B998F30E \
95636F3538D9262765AB29BEE952E584CA8C0F45 \
DAED928C727D3E613EC46635F5073C4F4882FFFC"
ENV REQUIRED_QUORUM=3

RUN case "${TARGETPLATFORM}" in \
      "linux/amd64")   echo "bitcoin-${VERSION}-x86_64-linux-gnu.tar.gz"    > /tarball-name ;; \
      "linux/arm64")   echo "bitcoin-${VERSION}-aarch64-linux-gnu.tar.gz"   > /tarball-name ;; \
      "linux/riscv64") echo "bitcoin-${VERSION}-riscv64-linux-gnu.tar.gz"   > /tarball-name ;; \
      *) echo "Unsupported platform: ${TARGETPLATFORM}" && exit 1 ;; \
    esac

RUN wget https://bitcoinknots.org/files/${PATH_VERSION}/${VERSION}/$(cat /tarball-name) \
         https://bitcoinknots.org/files/${PATH_VERSION}/${VERSION}/SHA256SUMS.asc \
         https://bitcoinknots.org/files/${PATH_VERSION}/${VERSION}/SHA256SUMS

COPY assets/release-keys/ /tmp/release-keys/
RUN gpg --import /tmp/release-keys/*.asc && \
    for fp in ${PINNED_FINGERPRINTS}; do \
        gpg --list-keys "$fp" >/dev/null 2>&1 || { echo "MISSING PINNED KEY: $fp"; exit 1; }; \
    done && \
    rm -rf /tmp/release-keys

# Verify SHA256SUMS.asc: any BADSIG from a pinned key fails the build,
# and at least REQUIRED_QUORUM pinned signers must verify successfully.
# (We don't use gpg's exit code because GnuPG 2.4+ treats ERRSIG —
# signatures from non-pinned signers — as a non-zero exit even when
# pinned-key signatures verified fine.)
RUN gpg --verify --status-fd 1 SHA256SUMS.asc SHA256SUMS 2>/dev/null > /tmp/gpg-status; \
    bad=$(grep -c '^\[GNUPG:\] BADSIG' /tmp/gpg-status || true); \
    good=$(grep -c '^\[GNUPG:\] GOODSIG' /tmp/gpg-status || true); \
    echo "Pinned signatures: good=${good}, bad=${bad} (need ${REQUIRED_QUORUM} good, 0 bad)"; \
    [ "${bad}" -eq 0 ] || { echo "BAD SIGNATURE FROM PINNED KEY"; exit 1; }; \
    [ "${good}" -ge "${REQUIRED_QUORUM}" ] || { echo "INSUFFICIENT QUORUM"; exit 1; }

RUN cp SHA256SUMS /sha256sums
RUN grep $(cat /tarball-name) /sha256sums | sha256sum -c

RUN tar -zxvf $(cat /tarball-name) --strip-components=1

# Final image
FROM debian:stable-slim

ENV BITCOIN_DATA=/root/.bitcoin
ENV BITCOIN_PREFIX=/opt/bitcoin
ENV PATH=${BITCOIN_PREFIX}/bin:$PATH

RUN apt-get update && apt-get install -y curl e2fsprogs jq yq 

COPY --from=builder /build/bin/bitcoind ${BITCOIN_PREFIX}/bin/
COPY --from=builder /build/bin/bitcoin-cli ${BITCOIN_PREFIX}/bin/

ARG ARCH

EXPOSE 8332 8333