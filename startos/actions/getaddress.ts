import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import {
  ensureWalletLoaded,
  getSelectedWallet,
  rootDir,
  rpcArgs,
} from '../utils'
import { i18n } from '../i18n'

export const getaddress = sdk.Action.withoutInput(
  // id
  'get-address',

  // metadata
  async ({ effects }) => {
    const conf = (await bitcoinConfFile.read().const(effects))!

    return {
      name: i18n('Get Address'),
      description: i18n('Get a new segwit address.'),
      warning: null,
      allowedStatuses: 'only-running',
      group: i18n('Wallet'),
      visibility: !conf?.raw?.disablewallet
        ? 'enabled'
        : { disabled: i18n('Wallet is disabled') },
    }
  },

  // execution function
  async ({ effects }) => {
    const mountpoint = '/scripts'

    const conf = (await bitcoinConfFile.read().const(effects))!
    const wallet = await getSelectedWallet()

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
      'getaddress',
      async (subc) => {
        await ensureWalletLoaded(subc, { prune: !!conf.prune, wallet })

        return await subc.execFail([
          'bitcoin-cli',
          ...rpcArgs({ prune: !!conf.prune, wallet }),
          'getnewaddress',
          '',
          'bech32',
        ])
      },
    )

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n('Your new address: ${stdout}', {
        stdout: res.stdout as string,
      }),
      result: null,
    }
  },
)
