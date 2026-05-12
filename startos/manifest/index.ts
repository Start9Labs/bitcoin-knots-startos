import { setupManifest } from '@start9labs/start-sdk'
import {
  alertRestore,
  alertUninstall,
  long,
  short,
  torDescription,
} from './i18n'

export const manifest = setupManifest({
  id: 'bitcoind',
  title: 'Bitcoin Knots plus BIP-110',
  license: 'MIT',
  donationUrl: null,
  packageRepo: 'https://github.com/Start9Labs/bitcoin-knots-startos/tree/bip-110/next',
  upstreamRepo: 'https://github.com/dathonohm/bitcoin',
  marketingUrl: 'https://bip110.org/',
  docsUrls: [
    'https://docs.start9.com/bitcoin-guides/',
  ],
  description: { short, long },
  volumes: ['main', 'i2pd'],
  images: {
    bitcoind: {
      source: {
        dockerBuild: {
          buildArgs: {
            VERSION: "29.3.knots20260210+bip110-v0.4.1",
          }
        },
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
        icon: 'https://raw.githubusercontent.com/Start9Labs/tor-startos/65faea17febc739d910e8c26ff4e61f6333487a8/icon.svg',
      },
    },
  },
})
