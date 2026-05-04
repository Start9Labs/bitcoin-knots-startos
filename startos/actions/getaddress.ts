import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { rootDir, rpcArgs } from '../utils'
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
      'getaddress',
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
        
        return await subc.execFail([
          'bitcoin-cli',
          ...rpcArgs({ prune: !!conf.prune }),
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
