import { short, long, alertUninstall, alertRestore } from './i18n'
import { setupManifest } from '@start9labs/start-sdk'

export const manifest = setupManifest({
  id: 'bitcoind',
  title: 'Bitcoin Knots',
  license: 'MIT',
  donationUrl: null,
  wrapperRepo: 'https://github.com/Retropex/knots-startos',
  upstreamRepo: 'https://github.com/bitcoinknots/bitcoin',
  supportSite: 'https://github.com/Retropex/knots-startos/issues',
  marketingSite: 'https://bitcoinknots.org/',
  docsUrl:
    'https://github.com/Retropex/knots-startos/blob/next/docs/instructions.md',
  description: { short, long },
  volumes: ['main', 'i2pd'],
  images: {
    bitcoind: {
      source: {
        dockerBuild: {
          workdir: './',
          dockerfile: 'Dockerfile',
        },
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    proxy: {
      source: {
        dockerTag: 'ghcr.io/start9labs/btc-rpc-proxy',
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissingAs: 'aarch64',
    },
    python: {
      source: {
        dockerTag: 'python:3.13.11-alpine',
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    i2pd: {
      source: {
        dockerTag: 'purplei2p/i2pd:release-2.58.0',
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissingAs: 'aarch64',
    }
  },
  alerts: {
    install: null,
    update: null,
    uninstall: alertUninstall,
    restore: alertRestore,
    start: null,
    stop: null,
  },
  dependencies: {},
})
