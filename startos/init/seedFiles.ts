import {
  archivalMin,
  bitcoinConfFile,
  defaultBlockmaxsize,
  defaultBlockmaxweight,
  defaultDatacarriercost,
  defaultDbcache,
  defaultPrune,
} from '../fileModels/bitcoin.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { i2PSamAddress } from '../utils'
import * as diskusage from 'diskusage'
import { utils } from '@start9labs/start-sdk'
import { i2pdConfFile } from '../fileModels/i2pd.conf'

const diskUsage = utils.once(() => diskusage.check('/'))

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  await storeJson.merge(effects, {})

  await bitcoinConfFile.merge(effects, {
    zmqEnabled: true,
    blockfilters: { blockfilterindex: true },
    dbcache: defaultDbcache,
    natpmp: false,
    datacarriercost: defaultDatacarriercost,
    templateconstruction: {
      blockmaxsize: defaultBlockmaxsize,
      blockmaxweight: defaultBlockmaxweight,
    },
    ...((await diskUsage()).total < archivalMin
      ? { prune: defaultPrune }
      : {}),
    raw: {
      i2psam: i2PSamAddress,
    },
  })

  await i2pdConfFile.merge(effects, {})
})
