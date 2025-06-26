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
        /*
          We want to merge bitcoin knots defaults into bitcoin.conf if those options
          were not present in bitcoin.conf at flavor migration
        */
        const existingBitcoinConf = await bitcoinConfFile.read().once()
        const nonConstDefaults: Record<string, any> = { ...bitcoinConfDefaults }

        if (existingBitcoinConf) {
          const newOptions: Record<string, any> = {}
          for (const k in nonConstDefaults) {
            if (!(k in existingBitcoinConf)) {
              newOptions[k] = nonConstDefaults[k]
            }
          }
          await bitcoinConfFile.merge(effects, newOptions)
        } else {
          // Write the bitcoin.conf if it doesn't exist
          await bitcoinConfFile.write(effects, bitcoinConfDefaults)
        }
      },
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
