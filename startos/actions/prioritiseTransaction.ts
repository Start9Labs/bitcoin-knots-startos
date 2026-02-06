import { mainMounts } from '../main'
import { rootDir } from '../utils'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { rpcPort } from '../utils'
import { sdk } from '../sdk'
import { i18n } from '../i18n'
const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  txid: Value.dynamicText(async ({ effects }) => {
    return {
      name: 'txid',
      description: i18n('Transaction ID'),
      required: true,
      default: null,
      patterns: [
        {
          regex: '^[a-zA-Z0-9]+$',
          description: i18n('Must be alphanumeric.'),
        },
      ],
    }
  }),
  prioritydelta: Value.dynamicText(async ({ effects }) => {
    return {
      name: i18n('priority_delta'),
      description: i18n('The transaction selection algorithm considers the tx as it would have a higher priority'),
      required: true,
      default: '1',
    }
  }),
  deltafee: Value.dynamicText(async ({ effects }) => {
    return {
      name: i18n('Fee delta'),
      description: i18n('The fee value (in satoshis) to add (or subtract, if negative).'),
      required: true,
      default: '1',
    }
  }),
})

export const prioritiseTransaction = sdk.Action.withInput(
  // id
  'prioritise-transaction',

  // metadata
  async ({ effects }) => ({
    name: i18n('Prioritize Transaction'),
    description:
      i18n('Prioritize transaction with a specific fee delta.'),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // input spec
  inputSpec,

  // optionally pre-fill form
  async ({ effects }) => {},

  // execution function
  async ({ effects, input }) => {
    const conf = (await bitcoinConfFile.read().const(effects))!
    const { txid, prioritydelta, deltafee } = input

    const prioritisetransaction = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'bitcoind' },
      mainMounts,
      'getnetworkinfo',
      async (subc) => {
        return await subc.execFail([
          'bitcoin-cli',
          `-conf=${rootDir}/bitcoin.conf`,
          `-rpccookiefile=${rootDir}/.cookie`,
          `-rpcport=${conf.prune ? 18332 : rpcPort}`,
          `prioritisetransaction`,
          `${txid}`,
          `${prioritydelta}`,
          `${deltafee}`,
        ])
      },
    )

    if (prioritisetransaction) {
      return {
        version: '1',
        title: 'Success',
        message: i18n('${txid} has been prioritzed.', {
          txid: txid as string,
        }),
        result: null,
      }
    } else {
      return {
        version: '1',
        title: 'Failure',
        message: i18n('Prioritize transaction has failed'),
        result: null,
      }
    }
  },
)
