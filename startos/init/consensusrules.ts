import { activateRDTS } from '../actions/activaterdts'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const taskConsensusRules = sdk.setupOnInit(async (effects) => {
  const conf = await bitcoinConfFile.read().const(effects)
  if (conf?.consensusrules !== 'rdts') {
    await sdk.action.createOwnTask(effects, activateRDTS, 'critical', {
      reason: i18n(
        'This version of Bitcoin Knots will eventually enforce the BIP-110 (RDTS) consensus rules. Activate RDTS to acknowledge, or switch to the "Bitcoin Knots (no-rdts)" flavor in the marketplace.',
      ),
    })
  }
})
