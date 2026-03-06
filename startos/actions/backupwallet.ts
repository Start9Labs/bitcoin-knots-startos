import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { rootDir, rpcArgs } from '../utils'
import { i18n } from '../i18n'

export const backupwallet = sdk.Action.withoutInput(
  // id
  'backup-wallet',

  // metadata
  async ({ effects }) => ({
	name: i18n('Backup wallet'),
	description:
	  i18n('Backup wallet in a file for startOS system backup'),
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
	  'Backup wallet',
	  async (subc) => {
		return await subc.execFail([
		  `${mountpoint}/backupwallet.sh`,
		  ...rpcArgs({ prune: !!conf.prune }),
		  `${rootDir}/coin.dat`,
		])
	  },
	)
	
	return {
	  version: '1',
	  title: 'Sucess',
	  message: i18n('Your wallet has backup in coin.dat'),
	  result: null,
	}
  },
)
