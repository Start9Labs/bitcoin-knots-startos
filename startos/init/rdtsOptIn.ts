import { activateRDTS } from '../actions/activaterdts'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const taskRdtsOptIn = sdk.setupOnInit(async (effects) => {
  // `consensusrules=rdts` was this flavor's consent record until the split
  // made it meaningless — the opt-in now lives in the store, which no other
  // flavor carries. Cleared here rather than in a migration so every arrival
  // path is covered; merge only writes when the file actually changes.
  await bitcoinConfFile.merge(effects, { raw: { consensusrules: undefined } })

  const store = await storeJson.read().const(effects)
  if (!store?.rdtsAcknowledged) {
    await sdk.action.createOwnTask(effects, activateRDTS, 'critical', {
      reason: i18n(
        'Confirm that you understand this version follows the RDTS chain — a separate blockchain from the one Bitcoin Core and Bitcoin Knots (pre-RDTS) follow, on which blocks currently arrive about once every day or two.',
      ),
    })
  }
})
