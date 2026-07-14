import { T } from '@start9labs/start-sdk'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import {
  bitcoinMounts,
  defaultWalletName,
  getSelectedWallet,
  rpcArgs,
  walletLabel,
} from '../utils'
import { i18n } from '../i18n'

const { InputSpec, Value } = sdk

/** UI-only sentinel used to represent bitcoind's default wallet ('') in the
 *  dropdown. StartOS's dynamicSelect treats '' as "no selection" (same as an
 *  HTML `<option value="">`) and refuses to submit it, so we display an
 *  opaque token in the form and translate to/from '' at the form boundary.
 *  The store, RPC helpers, and every wallet-scoped action continue to
 *  operate on the real bitcoind wallet name. */
const DEFAULT_WALLET_UI_KEY = '__default__'
const toUiKey = (name: string): string =>
  name === '' ? DEFAULT_WALLET_UI_KEY : name
const fromUiKey = (key: string): string =>
  key === DEFAULT_WALLET_UI_KEY ? '' : key

/** Loaded wallets (listwallets) plus on-disk wallets not currently loaded
 *  (listwalletdir), so a dependent service's wallet is selectable too. */
async function listAllWallets(
  effects: T.Effects,
  opts: { prune: boolean },
): Promise<string[]> {
  return sdk.SubContainer.withTemp(
    effects,
    { imageId: 'bitcoind' },
    bitcoinMounts,
    'select-wallet-list',
    async (subc) => {
      const names = new Set<string>()

      const loadedRes = await subc.exec([
        'bitcoin-cli',
        ...rpcArgs({ prune: opts.prune }),
        'listwallets',
      ])
      try {
        for (const w of JSON.parse(String(loadedRes.stdout)))
          names.add(String(w))
      } catch {}

      const onDiskRes = await subc.exec([
        'bitcoin-cli',
        ...rpcArgs({ prune: opts.prune }),
        'listwalletdir',
      ])
      try {
        for (const w of JSON.parse(String(onDiskRes.stdout)).wallets ?? [])
          names.add(String(w.name))
      } catch {}

      return [...names].sort()
    },
  )
}

const inputSpec = InputSpec.of({
  wallet: Value.dynamicSelect(async ({ effects }) => {
    const conf = (await bitcoinConfFile.read().const(effects))!
    const selected = await getSelectedWallet(effects)

    let wallets: string[] = []
    try {
      wallets = await listAllWallets(effects, { prune: !!conf.prune })
    } catch {}

    // Always offer the current selection and the historical default so the
    // dropdown is never empty, even if the node couldn't be queried.
    const names = new Set<string>([...wallets, selected, defaultWalletName])

    const values = Object.fromEntries(
      [...names].sort().map((name) => [toUiKey(name), walletLabel(name)]),
    )

    return {
      name: i18n('Wallet'),
      description: i18n(
        'The wallet that all Wallet actions (Get Balance, Get Address, Send Coins, Sign Message, Backup Wallet, etc.) will operate on. Includes wallets created by dependent services such as BTCPay Server/NBXplorer.',
      ),
      default: toUiKey(names.has(selected) ? selected : defaultWalletName),
      values,
    }
  }),
})

export const selectWallet = sdk.Action.withInput(
  // id
  'select-wallet',

  // metadata
  async ({ effects }) => {
    const conf = (await bitcoinConfFile.read().const(effects))!
    const selected = await getSelectedWallet(effects)

    return {
      name: i18n('Select Wallet'),
      description: i18n(
        'Choose which wallet the Wallet actions operate on. Currently selected: ${wallet}',
        { wallet: walletLabel(selected) },
      ),
      warning: null,
      allowedStatuses: 'only-running',
      group: i18n('Wallet'),
      visibility: !conf?.raw?.disablewallet
        ? 'enabled'
        : { disabled: i18n('Wallet is disabled') },
    }
  },

  // input spec
  inputSpec,

  // optionally pre-fill form
  async () => ({
    wallet: toUiKey(await getSelectedWallet()),
  }),

  // execution function
  async ({ effects, input }) => {
    const wallet = fromUiKey(input.wallet)

    const conf = (await bitcoinConfFile.read().const(effects))!

    // Best-effort load so the selection is immediately usable. "Already
    // loaded" errors are ignored (non-failing exec).
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'bitcoind' },
      bitcoinMounts,
      'select-wallet',
      async (subc) => {
        await subc.exec([
          'bitcoin-cli',
          ...rpcArgs({ prune: !!conf.prune }),
          'loadwallet',
          wallet,
        ])
      },
    )

    await storeJson.merge(effects, { selectedWallet: wallet })

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n('Wallet actions will now operate on wallet: ${wallet}', {
        wallet: walletLabel(wallet),
      }),
      result: null,
    }
  },
)
