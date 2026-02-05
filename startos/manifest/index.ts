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
  volumes: ['main'],
  images: {
    bitcoind: {
      source: {
        dockerBuild: {
          workdir: './',
          dockerfile: 'Dockerfile',
        },
      },
    },
    proxy: {
      source: {
        dockerTag: 'ghcr.io/start9labs/btc-rpc-proxy',
      },
    },
    python: {
      source: {
        dockerTag: 'python:3.13.2-alpine',
      },
    },
  },
  alerts: {
    install: null,
    update: null,
    uninstall: alertRestore,
    restore: alertUninstall,
    start: null,
    stop: null,
  },
  dependencies: {},
})
