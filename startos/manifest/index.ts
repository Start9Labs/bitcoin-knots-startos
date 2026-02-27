import { setupManifest } from '@start9labs/start-sdk'
import {
  short,
  long,
  alertUninstall,
  alertRestore,
  torDescription,
} from './i18n'

export const manifest = setupManifest({
  id: 'bitcoind',
  title: 'Bitcoin Knots',
  license: 'MIT',
  donationUrl: null,
  packageRepo: 'https://github.com/Retropex/knots-startos/tree/next',
  upstreamRepo: 'https://github.com/bitcoinknots/bitcoin',
  marketingUrl: 'https://bitcoinknots.org/',
  docsUrls: [
    'https://docs.start9.com/bitcoin-guides/',
    'https://bitcoinknots.org/#about',
  ],
  description: { short, long },
  volumes: ['main', 'i2pd'],
  images: {
    bitcoind: {
      source: {
        dockerBuild: {},
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    proxy: {
      source: {
        dockerTag: 'ghcr.io/start9labs/btc-rpc-proxy',
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    python: {
      source: {
        dockerTag: 'python:3.14.2-alpine',
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    i2pd: {
      source: {
        dockerTag: 'purplei2p/i2pd:release-2.58.0',
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissingAs: 'x86_64',
    },
  },
  alerts: {
    uninstall: alertUninstall,
    restore: alertRestore,
  },
  dependencies: {
    tor: {
      description: torDescription,
      optional: true,
      metadata: {
        title: 'Tor',
        icon: 'https://raw.githubusercontent.com/Start9Labs/tor-startos/refs/heads/update/040/icon.png',
      },
    },
  },
})
