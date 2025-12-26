import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
import { bitcoinConfFile } from '../../fileModels/bitcoin.conf'
import { bitcoinConfFile as coreBitcoinConfFile } from 'bitcoin-core-startos/startos/fileModels/bitcoin.conf'
import { bitcoinConfDefaults } from '../../utils'
import { bitcoinConfDefaults as coreDefaults } from 'bitcoin-core-startos/startos/utils'
import { v29_2_0_2 } from 'bitcoin-core-startos/startos/install/versions/v29.2.0_2-beta.4'
import { v30_0_0_1 } from 'bitcoin-core-startos/startos/install/versions/v30.0.0_1-beta.7'
import { storeJson } from '../../fileModels/store.json'
import { sdk } from '../../sdk'
import { mainMounts } from '../../main'
const { whitebind, bind } = bitcoinConfDefaults

export const v29_2_0_9 = VersionInfo.of({
  version: '#knots:29.2:9-beta.1',
  releaseNotes: 'Revamped for StartOS 0.4.0',
  migrations: {
    up: async ({ effects }) => {
      await sdk.SubContainer.withTemp(
        effects,
        { imageId: 'bitcoind' },
        mainMounts,
        'nocow',
        async (subc) => {
          await subc.execFail(['chattr', '-R', '+C', '/.bitcoin'])
        },
      )
      const store = await storeJson.read().once()

      if (!store) {
        await storeJson.write(effects, {
          reindexBlockchain: false,
          reindexChainstate: false,
          fullySynced: false,
          snapshotInUse: false,
        })
      }
      const existingConf = await bitcoinConfFile.read().once()

      if (existingConf) {
        await bitcoinConfFile.merge(effects, {
          rpcuser: undefined,
          rpcpassword: undefined,
          bind,
          whitebind,
          whitelist: undefined,
        })
        return
      } // Only write conf defaults if no existing bitcoin.conf found

      await bitcoinConfFile.write(effects, bitcoinConfDefaults)
    },
    down: IMPOSSIBLE,
    other: {
      [v29_2_0_2.options.version]: {
        // Core -> Knots
        up: async ({ effects }) => {
          /*
              We want to merge bitcoin knots defaults into bitcoin.conf if those options
              were not present in bitcoin.conf at flavor migration
            */
          const existingBitcoinConf = await bitcoinConfFile.read().once()
          const nonConstDefaults: Record<string, any> = {
            ...bitcoinConfDefaults,
          }

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
        // Knots -> Core
        down: async ({ effects }) => {
          /*
              We want to merge bitcoin core defaults into bitcoin.conf if those options
              were not present in bitcoin.conf at flavor migration
            */
          const existingBitcoinConf = await bitcoinConfFile.read().once()
          const nonConstDefaults: Record<string, any> = { ...coreDefaults }

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
            await coreBitcoinConfFile.write(effects, coreDefaults)
          }
        },
      },
      [v30_0_0_1.options.version]: {
        // Core -> Knots
        up: async ({ effects }) => {
          /*
              We want to merge bitcoin knots defaults into bitcoin.conf if those options
              were not present in bitcoin.conf at flavor migration
            */
          const existingBitcoinConf = await bitcoinConfFile.read().once()
          const nonConstDefaults: Record<string, any> = {
            ...bitcoinConfDefaults,
          }

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
        // Knots -> Core
        down: async ({ effects }) => {
          /*
              We want to merge bitcoin core defaults into bitcoin.conf if those options
              were not present in bitcoin.conf at flavor migration
            */
          const existingBitcoinConf = await bitcoinConfFile.read().once()
          const nonConstDefaults: Record<string, any> = { ...coreDefaults }

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
            await coreBitcoinConfFile.write(effects, coreDefaults)
          }
        },
      },
    },
  },
}).satisfies(v29_2_0_2.options.version)
