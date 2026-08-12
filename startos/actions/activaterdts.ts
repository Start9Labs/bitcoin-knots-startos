import { i18n } from '../i18n'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  acknowledge: Value.toggle({
    name: i18n('I acknowledge'),
    description: null,
    default: false,
  }),
})

export const activateRDTS = sdk.Action.withInput(
  // id
  'activate-rdts',

  // metadata
  async ({ effects }) => ({
    name: i18n('RDTS Chain Opt-In'),
    description: '',
    warning: i18n(
      'The BIP-110 Reduced Data Temporary Softfork ("RDTS") did not carry the Bitcoin network. In August 2026, at block 961,632, the nodes enforcing it split onto a chain of their own, and this version of Bitcoin Knots follows that chain. Installing it, or switching to it from Bitcoin Core or Bitcoin Knots (pre-RDTS), is not an update: it moves your node onto a different blockchain and a different network. Two consequences to weigh before you accept. First, the RDTS chain barely moves. It kept Bitcoin\'s mining difficulty but attracted a tiny fraction of its hashpower, so a block arrives roughly once every day or two. Your node will look healthy while standing still — deposits will not confirm, and services that depend on it, Lightning among them, will stall. A hard fork to a new proof-of-work algorithm is planned for 1 September 2026 to restore normal block production; until then, expect the chain to crawl. Second, the two chains share no replay protection: a transaction you broadcast on one can be replayed on the other and spend the same coins there. To follow the chain the rest of the Bitcoin network follows, use Bitcoin Core or Bitcoin Knots (pre-RDTS) instead, both in the Start9 marketplace. Start9\'s guidance is at https://start9.com/bip110/.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'hidden',
  }),

  // input spec
  inputSpec,

  // optionally pre-fill form
  async ({ effects }) => ({}),

  // execution function
  async ({ effects, input }) => {
    if (!input.acknowledge) {
      throw new Error(i18n('Please acknowledge'))
    }
    await storeJson.merge(effects, { rdtsAcknowledged: true })
  },
)
