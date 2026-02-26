import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { rootDir, rpcPort } from '../utils'
import { i18n } from '../i18n'

export const getaddress = sdk.Action.withoutInput(
  // id
  'get-address',

  // metadata
  async ({ effects }) => ({
    name: i18n('Get Address'),
    description: i18n('Get a new segwit address.'),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Wallet'),
    visibility: 'enabled',
  }),

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
      title: i18n('Success'),
      message: i18n('Your new address: ${stdout}', {
        stdout: res.stdout as string,
      }),
      result: null,
    }
  },
)
