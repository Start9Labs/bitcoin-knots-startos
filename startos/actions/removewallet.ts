import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { rootDir, rpcArgs } from '../utils'
import { i18n } from '../i18n'

export const removewallet = sdk.Action.withoutInput(
  // id
  'remove-wallet',

  // metadata
  async ({ effects }) => ({
	name: i18n('Remove wallet'),
	description:
	  i18n('Remove the wallet in Bitcoin Knots'),
	warning: i18n('⚠️ Please be sure that your wallet is empty, or that you have a backup. Without a backup this will lead to a permanent loss of funds.'),
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
	  'Remove wallet',
	  async (subc) => {
		return await subc.execFail([
		  `${mountpoint}/removewallet.sh`,
		  ...rpcArgs({ prune: !!conf.prune }),
		  `${rootDir}/coin`,
		])
	  },
	)
	
	return {
	  version: '1',
	  title: 'Sucess',
	  message: i18n('Your wallet has been removed.'),
	  result: null,
	}
  },
)
