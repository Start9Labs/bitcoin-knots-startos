import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
import { storeJson } from '../../fileModels/store.json'
import { current as bitcoinCoreCurrent } from 'bitcoind-startos/startos/install/versions'
import { bitcoinConfFile } from '../../fileModels/bitcoin.conf'
import { bitcoinConfDefaults } from '../../utils'

export const v28_1_0_3 = VersionInfo.of({
  version: '#knots:28.1:3-alpha.0',
  releaseNotes: 'Revamped for StartOS 0.4.0',
  migrations: {
    other: {
      [bitcoinCoreCurrent.options.version]: async ({ effects }) => {
        // merge knots defaults into bitcoin.conf
        await bitcoinConfFile.merge(effects, bitcoinConfDefaults)
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

