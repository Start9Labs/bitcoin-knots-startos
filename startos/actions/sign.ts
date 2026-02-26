import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { rootDir, rpcPort } from '../utils'
import { i18n } from '../i18n'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  address: Value.dynamicText(async ({ effects }) => ({
    name: i18n('Address'),
    description: i18n(
      'The Bitcoin address you want to use to sign the message.',
    ),
    required: true,
    default: null,
    patterns: [
      {
        regex: '^[a-zA-Z0-9]+$',
        description: i18n('Must be alphanumeric.'),
      },
    ],
  })),
  message: Value.dynamicText(async ({ effects }) => ({
    name: i18n('Message'),
    description: i18n('The message you want to sign.'),
    required: true,
    default: null,
  })),
})

export const signMessage = sdk.Action.withInput(
  // id
  'sign-message',

  // metadata
  async ({ effects }) => ({
    name: i18n('Sign Message'),
    description: i18n('Sign a message with one of your Bitcoin addresses.'),
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
    const { address, message } = input

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
      'sign-message',
      async (subc) => {
        return await subc.execFail([
          `${mountpoint}/sign.sh`,
          `-conf=${rootDir}/bitcoin.conf`,
          `-rpccookiefile=${rootDir}/.cookie`,
          `-rpcport=${conf.prune ? 18332 : rpcPort}`,
          `${address}`,
          `${message}`,
        ])
      },
    )

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n('Your signature: ${stdout}', {
        stdout: res.stdout as string,
      }),
      result: null,
    }
  },
)
