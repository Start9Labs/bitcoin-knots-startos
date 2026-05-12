import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { activateRDTS } from '../actions/activatedrdts'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const taskConsensusRules = sdk.setupOnInit(async (effects) => {
  const conf = await bitcoinConfFile.read().const(effects)
  if (conf?.consensusrules !== 'rdts') {
    await sdk.action.createOwnTask(effects, activateRDTS, 'critical', {
      reason: 'This release adds enforcement of the one-year reduced data protocol change to the Bitcoin rules.',
    })
  }
})