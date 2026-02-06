import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { rootDir } from '../utils'
import { rpcPort } from '../utils'
import { mainMounts } from '../main'
import { i18n } from '../i18n'

export const getaddress = sdk.Action.withoutInput(
  // id
  'get-address',

  // metadata
  async ({ effects }) => ({
    name: i18n('Get Address'),
    description:
      i18n('Get a new segwit address.'),
    warning: null,
    allowedStatuses: 'any',
    group: 'Wallet',
    visibility: 'enabled',
  }),

  // execution function
  async ({ effects }) => {

    const mountpoint = '/scripts'
    
    const conf = (await bitcoinConfFile.read().const(effects))!

    const res = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'bitcoind' },
      sdk.Mounts.of().mountVolume ({
      volumeId: 'main',
      subpath: null, 
      mountpoint: rootDir,  
      readonly: false,
      }).mountAssets({ subpath: null, mountpoint}),
      'Sign Message',
      async (subc) => {
        return await subc.execFail([
          `${mountpoint}/getaddress.sh`,
          `-conf=${rootDir}/bitcoin.conf`,
          `-rpccookiefile=${rootDir}/.cookie`,
          `-rpcport=${conf.prune ? 18332 : rpcPort}`,
        ])
      },
    )
    
    return {
      version: '1',
      title: 'Sucess',
      message: i18n('Your new address: ${stdout}', {
        stdout: res.stdout as string,
      }),
      result: null,
    }
  },
)
