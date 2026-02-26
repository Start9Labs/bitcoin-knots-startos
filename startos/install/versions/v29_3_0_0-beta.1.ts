import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
import { bitcoinConfFile } from '../../fileModels/bitcoin.conf'
import { bitcoinConfFile as coreBitcoinConfFile } from 'bitcoin-core-startos/startos/fileModels/bitcoin.conf'
import { bitcoinConfDefaults } from '../../utils'
import { bitcoinConfDefaults as coreDefaults } from 'bitcoin-core-startos/startos/utils'
import { v29_2_0_2 } from 'bitcoin-core-startos/startos/install/versions/v29.2.0_2'
import { v30_2_0_1 } from 'bitcoin-core-startos/startos/install/versions/v30.2.0_1'
import { storeJson } from '../../fileModels/store.json'
import { sdk } from '../../sdk'
import { bitcoinMounts, peerPortExternal, peerPortInternal } from '../../utils'

export const v29_3_0_1 = VersionInfo.of({
  version: '#knots:29.3:0-beta.1',
  releaseNotes: {
    en_US: 'Add new wallet actions',
    fr_FR: 'Ajout de nouvelles actions pour le portefeuille',
  },
  migrations: {
    up: async ({ effects }) => {
      await sdk.SubContainer.withTemp(
        effects,
        { imageId: 'bitcoind' },
        bitcoinMounts,
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
          wantsOnion: false,
        })
      }
      const existingConf = await bitcoinConfFile.read().once()

      if (existingConf) {
        await bitcoinConfFile.merge(effects, {
          raw: {
            rpcuser: undefined,
            rpcpassword: undefined,
            bind: `0.0.0.0:${peerPortInternal}`,
            whitebind: `0.0.0.0:${peerPortExternal}`,
            whitelist: undefined,
          },
        })
        return
      } // Only write conf defaults if no existing bitcoin.conf found

      await bitcoinConfFile.merge(effects, { raw: bitcoinConfDefaults })
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
            const existingRaw = existingBitcoinConf.raw ?? {}
            const newOptions: Record<string, any> = {}
            for (const k in nonConstDefaults) {
              if (!(k in existingRaw)) {
                newOptions[k] = nonConstDefaults[k]
              }
            }
            await bitcoinConfFile.merge(effects, { raw: newOptions })
          } else {
            // Write the bitcoin.conf if it doesn't exist
            await bitcoinConfFile.merge(effects, { raw: bitcoinConfDefaults })
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
            const existingRaw = existingBitcoinConf.raw ?? {}
            const newOptions: Record<string, any> = {}
            for (const k in nonConstDefaults) {
              if (!(k in existingRaw)) {
                newOptions[k] = nonConstDefaults[k]
              }
            }
            await bitcoinConfFile.merge(effects, { raw: newOptions })
          } else {
            // Write the bitcoin.conf if it doesn't exist
            await coreBitcoinConfFile.merge(effects, {
              raw: { ...coreDefaults },
            })
          }
        },
      },
      [v30_2_0_1.options.version]: {
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
            const existingRaw = existingBitcoinConf.raw ?? {}
            const newOptions: Record<string, any> = {}
            for (const k in nonConstDefaults) {
              if (!(k in existingRaw)) {
                newOptions[k] = nonConstDefaults[k]
              }
            }
            await bitcoinConfFile.merge(effects, { raw: newOptions })
          } else {
            // Write the bitcoin.conf if it doesn't exist
            await bitcoinConfFile.merge(effects, { raw: bitcoinConfDefaults })
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
            const existingRaw = existingBitcoinConf.raw ?? {}
            const newOptions: Record<string, any> = {}
            for (const k in nonConstDefaults) {
              if (!(k in existingRaw)) {
                newOptions[k] = nonConstDefaults[k]
              }
            }
            await bitcoinConfFile.merge(effects, { raw: newOptions })
          } else {
            // Write the bitcoin.conf if it doesn't exist
            await coreBitcoinConfFile.merge(effects, {
              raw: { ...coreDefaults },
            })
          }
        },
      },
    },
  },
}).satisfies(v29_2_0_2.options.version)
