import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const activateRDTS = sdk.Action.withoutInput(
  // id
  'activate-rdts',

  // metadata
  async ({ effects }) => {

    return {
      name: 'Activate RDTS',
      description: 'Bitcoin Knots will enforce RDTS',
      warning: 'This version of Bitcoin Knots applies the BIP110 (RDTS) network upgrade, which fixes critical vulnerabilities in long-standing network design. To avoid applying this upgrade by accident, this version asks for explicit confirmation. Important: Because this upgrade already has broad community support, skipping this update or reverting to an older software version does not reject it. Running outdated software after any network upgrade only leaves your node vulnerable to displaying fake or fraudulent transactions. To effectively reject this upgrade, you need to run alternative software designed to split away from the upgraded network. If you do not know what you are doing, you can learn more at https://bitcoinknots.org/learn/2026-rdts. If you are not ready to adopt the RDTS upgrade yet, you can alternatively switch to the pre RDTS Bitcoin Knots version available on the start9 app store which is the same version of Bitcoin Knots without RDTS support (NOT RECOMMENDED).',
      allowedStatuses: 'any',
      group: 'Config',
      visibility: 'hidden',
    }
  },

    // the execution function
  async ({ effects }) => {
    await bitcoinConfFile.merge(effects, { consensusrules: 'rdts' })

    return {
      version: '1',
      title: 'Success',
      message: 'RDTS is now activated',
      result: null
    }
  },
)
