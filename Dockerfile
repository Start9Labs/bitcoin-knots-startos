# Build stage
FROM debian:stable-slim AS builder

ARG VERSION
ARG PATH_VERSION
ARG TARGETPLATFORM

WORKDIR /build

RUN apt-get update && apt-get install -y wget pgp curl jq

RUN case "${TARGETPLATFORM}" in \
      "linux/amd64")   echo "bitcoin-${VERSION}-x86_64-linux-gnu.tar.gz"    > /tarball-name ;; \
      "linux/arm64")   echo "bitcoin-${VERSION}-aarch64-linux-gnu.tar.gz"   > /tarball-name ;; \
      "linux/riscv64") echo "bitcoin-${VERSION}-riscv64-linux-gnu.tar.gz"   > /tarball-name ;; \
      *) echo "Unsupported platform: ${TARGETPLATFORM}" && exit 1 ;; \
    esac

RUN wget https://bitcoinknots.org/files/${PATH_VERSION}/${VERSION}/$(cat /tarball-name) \
         https://bitcoinknots.org/files/${PATH_VERSION}/${VERSION}/SHA256SUMS.asc \
         https://bitcoinknots.org/files/${PATH_VERSION}/${VERSION}/SHA256SUMS

# GPG key pinning for regular signers (embedded so the build doesn't depend on a keyserver)
COPY assets/release-keys/ /tmp/release-keys/
RUN gpg --import /tmp/release-keys/*.asc && rm -rf /tmp/release-keys
# Fetch additional keys for the SHA256SUMS.asc file
RUN curl -s "https://api.github.com/repos/bitcoinknots/guix.sigs/contents/builder-keys" | jq -r '.[].download_url' | while read url; do curl -s "$url" | gpg --import; done
RUN gpg --verify SHA256SUMS.asc SHA256SUMS

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