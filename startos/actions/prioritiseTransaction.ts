import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { bitcoinCliArgs, bitcoinMounts } from '../utils'
import { i18n } from '../i18n'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  txid: Value.dynamicText(async ({ effects }) => ({
    name: i18n('TXID'),
    description: i18n('Transaction ID'),
    required: true,
    default: null,
    patterns: [
      {
        regex: '^[a-zA-Z0-9]+$',
        description: i18n('Must be alphanumeric.'),
      },
    ],
  })),
  prioritydelta: Value.dynamicText(async ({ effects }) => ({
    name: i18n('Priority Delta'),
    description: i18n(
      'The transaction selection algorithm considers the tx as it would have a higher priority',
    ),
    required: true,
    default: '1',
  })),
  deltafee: Value.dynamicText(async ({ effects }) => ({
    name: i18n('Fee Delta'),
    description: i18n(
      'The fee value (in satoshis) to add (or subtract, if negative).',
    ),
    required: true,
    default: '1',
  })),
})

export const prioritiseTransaction = sdk.Action.withInput(
  // id
  'prioritise-transaction',

  // metadata
  async ({ effects }) => ({
    name: i18n('Prioritize Transaction'),
    description: i18n('Prioritize transaction with a specific fee delta.'),
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  // input spec
  inputSpec,

  // optionally pre-fill form
  async ({ effects }) => ({}),

  // execution function
  async ({ effects, input }) => {
    const conf = (await bitcoinConfFile.read().const(effects))!
    const { txid, prioritydelta, deltafee } = input

    const prioritisetransaction = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'bitcoind' },
      bitcoinMounts,
      'prioritisetransaction',
      async (subc) => {
        return await subc.execFail([
          ...bitcoinCliArgs({ prune: !!conf.prune }),
          'prioritisetransaction',
          `${txid}`,
          `${prioritydelta}`,
          `${deltafee}`,
        ])
      },
    )

    if (prioritisetransaction) {
      return {
        version: '1',
        title: i18n('Success'),
        message: i18n('${txid} has been prioritized.', {
          txid: txid as string,
        }),
        result: null,
      }
    } else {
      return {
        version: '1',
        title: i18n('Failure'),
        message: i18n('Prioritize transaction has failed'),
        result: null,
      }
    }
  },
)
