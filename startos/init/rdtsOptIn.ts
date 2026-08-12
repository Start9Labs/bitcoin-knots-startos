import { activateRDTS } from '../actions/activaterdts'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const taskRdtsOptIn = sdk.setupOnInit(async (effects) => {
  // The opt-in lives in the store, not in `consensusrules` — that option is
  // pinned by the file model to keep the binary quiet and says nothing about
  // what the user agreed to. No other flavor carries this key.
  const store = await storeJson.read().const(effects)
  if (!store?.rdtsAcknowledged) {
    await sdk.action.createOwnTask(effects, activateRDTS, 'critical', {
      reason: i18n(
        'Confirm that you understand this version follows the RDTS chain — a separate blockchain from the one Bitcoin Core and Bitcoin Knots (pre-RDTS) follow, on which blocks currently arrive about once every day or two.',
      ),
    })
  }
})
