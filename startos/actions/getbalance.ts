import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { rootDir, rpcArgs } from '../utils'
import { i18n } from '../i18n'

export const getbalance = sdk.Action.withoutInput(
  // id
  'get-balance',

  // metadata
  async ({ effects }) => {
    const conf = (await bitcoinConfFile.read().const(effects))!
    
    return {
      name: i18n('Get Balance'),
      description: i18n('Get the balance of your Bitcoin wallet.'),
      warning: null,
      allowedStatuses: 'only-running',
      group: i18n('Wallet'),
      visibility: !conf?.raw?.disablewallet ? 'enabled' : { disabled: i18n('Wallet is disabled') },
    }
  },

  // execution function
  async ({ effects }) => {
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
      'getbalance',
      async (subc) => {
        await subc.exec([
          'bitcoin-cli',
          ...rpcArgs({ prune: !!conf.prune }),
          'createwallet',
          'coin',
        ])
        
        await subc.exec([
          'bitcoin-cli',
          ...rpcArgs({ prune: !!conf.prune }),
          'loadwallet',
          'coin',
        ])
        
        const balancesRes = await subc.execFail([
          'bitcoin-cli',
          ...rpcArgs({ prune: !!conf.prune }),
          'getbalances',
        ])
        const result = JSON.parse(balancesRes.stdout as string)
        
        return `trusted: ${result.mine.trusted}, untrusted: ${result.mine.untrusted_pending}, immature: ${result.mine.immature}`
      },
    )

    return {
      version: '1',
      title: i18n('Success'),
      message: res,
      result: null,
    }
  },
)
