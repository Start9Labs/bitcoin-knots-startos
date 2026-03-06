import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { rootDir, rpcArgs } from '../utils'
import { i18n } from '../i18n'

export const restorewallet = sdk.Action.withoutInput(
  // id
  'restore-wallet',

  // metadata
  async ({ effects }) => ({
	name: i18n('Restore wallet'),
	description:
	  i18n('Restore wallet from the backup'),
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
	  'Restore wallet',
	  async (subc) => {
		return await subc.execFail([
		  `${mountpoint}/restorewallet.sh`,
		  ...rpcArgs({ prune: !!conf.prune }),
		  `${rootDir}/coin.dat`,
		])
	  },
	)
	
	return {
	  version: '1',
	  title: 'Sucess',
	  message: i18n('Your wallet has been restored'),
	  result: null,
	}
  },
)
