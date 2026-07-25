import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import {
  defaultWalletName,
  getSelectedWallet,
  isPathSafeWalletName,
  resolveWalletDir,
  rootDir,
  rpcArgs,
} from '../utils'
import { i18n } from '../i18n'

export const removewallet = sdk.Action.withoutInput(
  // id
  'remove-wallet',

  // metadata
  async ({ effects }) => {
    const conf = (await bitcoinConfFile.read().const(effects))!

    return {
      name: i18n('Remove wallet'),
      description: i18n('Remove the wallet in Bitcoin Knots'),
      warning: i18n(
        '⚠️ Please be sure that your wallet is empty, or that you have a backup. Without a backup this will lead to a permanent loss of funds.',
      ),
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

    // Refuse to delete anything whose name can't be safely turned into a
    // path under the datadir. In particular the default wallet '' lives at
    // the wallets root — an rm -rf there would destroy the entire datadir.
    if (!isPathSafeWalletName(wallet)) {
      return {
        version: '1' as const,
        title: i18n('Not removed'),
        message: i18n(
          'The selected wallet cannot be removed from here. Select a different wallet with the Select Wallet action, or manage it from the service that created it.',
        ),
        result: null,
      }
    }

    await sdk.SubContainer.withTemp(
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
      'Remove wallet',
      async (subc) => {
        await subc.exec([
          'bitcoin-cli',
          ...rpcArgs({ prune: !!conf.prune }),
          'unloadwallet',
          wallet,
        ])

        const walletDir = await resolveWalletDir(subc, wallet)
        return await subc.execFail(['rm', '-rf', walletDir])
      },
    )

    // The selected wallet no longer exists — point Actions back at the default
    await storeJson.merge(effects, { selectedWallet: defaultWalletName })

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n('Wallet ${wallet} has been removed.', { wallet }),
      result: null,
    }
  },
)
