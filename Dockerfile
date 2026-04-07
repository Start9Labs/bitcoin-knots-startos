# Build stage
FROM debian:stable-slim AS builder

ARG VERSION
ARG TARGETPLATFORM

WORKDIR /build

RUN apt-get update && apt-get install -y wget pgp curl jq

RUN case "${TARGETPLATFORM}" in \
      "linux/amd64")   echo "bitcoin-${VERSION}-x86_64-linux-gnu.tar.gz"    > /tarball-name ;; \
      "linux/arm64")   echo "bitcoin-${VERSION}-aarch64-linux-gnu.tar.gz"   > /tarball-name ;; \
      "linux/riscv64") echo "bitcoin-${VERSION}-riscv64-linux-gnu.tar.gz"   > /tarball-name ;; \
      *) echo "Unsupported platform: ${TARGETPLATFORM}" && exit 1 ;; \
    esac

RUN wget https://github.com/dathonohm/bitcoin/releases/download/v29.3.knots20260210%2Bbip110-v0.4.1/$(cat /tarball-name) \
         https://github.com/dathonohm/bitcoin/releases/download/v29.3.knots20260210%2Bbip110-v0.4.1/SHA256SUMS.asc \
         https://github.com/dathonohm/bitcoin/releases/download/v29.3.knots20260210%2Bbip110-v0.4.1/SHA256SUMS

# GPG key pinning for regular signers
RUN gpg --receive-keys 2B97F03293744D70F6BBA82F2E3A66FF67F98B4F DAED928C727D3E613EC46635F5073C4F4882FFFC 95636F3538D9262765AB29BEE952E584CA8C0F45
# Fetch additional keys for the SHA256SUMS.asc file
RUN curl -s "https://api.github.com/repos/dathonohm/guix.sigs/contents/builder-keys" | jq -r '.[].download_url' | while read url; do curl -s "$url" | gpg --import; done
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