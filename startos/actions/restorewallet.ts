import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import {
  getSelectedWallet,
  isPathSafeWalletName,
  rootDir,
  rpcArgs,
  walletLabel,
} from '../utils'
import { i18n } from '../i18n'

export const restorewallet = sdk.Action.withoutInput(
  // id
  'restore-wallet',

  // metadata
  async ({ effects }) => {
    const conf = (await bitcoinConfFile.read().const(effects))!

    return {
      name: i18n('Restore wallet'),
      description: i18n('Restore wallet from the backup'),
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

    // Must mirror the naming used by the Backup Wallet action
    const backupFile = isPathSafeWalletName(wallet)
      ? `${rootDir}/${wallet}.dat`
      : `${rootDir}/default.dat`

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
      'Restore wallet',
      async (subc) => {
        return await subc.execFail([
          'bitcoin-cli',
          ...rpcArgs({ prune: !!conf.prune }),
          'restorewallet',
          wallet,
          backupFile,
        ])
      },
    )

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n('Wallet ${wallet} has been restored from ${file}', {
        wallet: walletLabel(wallet),
        file: backupFile,
      }),
      result: null,
    }
  },
)
