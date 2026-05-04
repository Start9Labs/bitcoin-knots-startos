import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { rootDir, rpcArgs } from '../utils'
import { i18n } from '../i18n'

export const backupwallet = sdk.Action.withoutInput(
  // id
  'backup-wallet',

  // metadata
  async ({ effects }) => {
	const conf = (await bitcoinConfFile.read().const(effects))!
	
	return {
		name: i18n('Backup wallet'),
		description:
		  i18n('Backup wallet in a file for startOS system backup'),
		warning: null,
		allowedStatuses: 'only-running',
		group: 'Wallet',
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
	  sdk.Mounts.of().mountVolume ({
	  volumeId: 'main',
	  subpath: null, 
	  mountpoint: rootDir,  
	  readonly: false,
	  }).mountAssets({ subpath: null, mountpoint}),
	  'Backup wallet',
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
		  'backupwallet',
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
