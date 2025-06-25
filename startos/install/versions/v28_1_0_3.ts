import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
import { storeJson } from '../../fileModels/store.json'
import { current as bitcoinCoreCurrent } from 'bitcoind-startos/startos/install/versions'

export const v28_1_0_3 = VersionInfo.of({
  version: '#knots:28.1:3-alpha.0',
  releaseNotes: 'Revamped for StartOS 0.4.0',
  migrations: {
    other: {
      [bitcoinCoreCurrent.options.version]: async ({ effects }) => {
        // nothing should be required here as Knots should be able to take Bitcoin Core's bitcoin.conf as it exists without any changes for it to be used by knots as-is
      }
    },
    up: async ({ effects }) => {
      await storeJson.write(effects, {
        reindexBlockchain: false,
        reindexChainstate: false,
        fullySynced: false,
        snapshotInUse: false,
      })
    },
    down: IMPOSSIBLE,
  },
}).satisfies(bitcoinCoreCurrent.options.version)

