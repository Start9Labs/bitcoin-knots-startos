import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { rootDir, rpcArgs } from '../utils'
import { i18n } from '../i18n'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  address: Value.dynamicText(async ({ effects }) => ({
    name: i18n('Address'),
    description: i18n('The Bitcoin address you want to send the funds.'),
    required: true,
    default: null,
    patterns: [
      {
        regex: '^[a-zA-Z0-9]+$',
        description: i18n('Must be alphanumeric.'),
      },
    ],
  })),
  amount: Value.dynamicText(async ({ effects }) => ({
    name: i18n('Amount'),
    description: i18n('Amount of the transaction. (in BTC)'),
    required: true,
    default: null,
  })),
  fee: Value.dynamicText(async ({ effects }) => ({
    name: i18n('Fee'),
    description: i18n(
      'Fees in sat/vbytes you want to pay for the transaction.',
    ),
    required: true,
    default: null,
  })),
})

export const sendCoin = sdk.Action.withInput(
  // id
  'send-coin',

  // metadata
  async ({ effects }) => ({
    name: i18n('Send Coins'),
    description: i18n('Send coins to a Bitcoin address.'),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Wallet'),
    visibility: 'enabled',
  }),

  // input spec
  inputSpec,

  // optionally pre-fill form
  async ({ effects }) => ({}),

  // execution function
  async ({ effects, input }) => {
    const { address, amount, fee } = input

    const mountpoint = '/scripts'

    const conf = (await bitcoinConfFile.read().const(effects))!

    const res = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'bitcoind' },
      sdk.Mounts.of()
        .mountVolume({
          volumeId: 'main',
          subpath: null,
          mountpoint: rootDir,
          readonly: false,
        })
        .mountAssets({ subpath: null, mountpoint }),
      'sendcoin',
      async (subc) => {
        return await subc.execFail([
          `${mountpoint}/sendcoin.sh`,
          ...rpcArgs({ prune: !!conf.prune }),
          `${address}`,
          `${amount}`,
          `${fee}`,
        ])
      },
    )

    return {
      version: '1',
      title: i18n('Success'),
      message: `TXID: ${res.stdout}`,
      result: null,
    }
  },
)
