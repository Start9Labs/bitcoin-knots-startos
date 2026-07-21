import { storeJson } from '../fileModels/store.json'
import { RDTS_FIRST_APPLICABLE_HEIGHT } from '../forkRecovery'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const revalidateRdts = sdk.Action.withoutInput(
  // id
  'revalidate-rdts',

  // metadata
  async ({ effects }) => ({
    name: i18n('Re-validate Against RDTS'),
    description: i18n(
      'Re-validate every block from the first RDTS-applicable height (${height}) under the BIP-110 (RDTS) consensus rules. Needed when RDTS enforcement arrives on a chain that already advanced past that height without it — for example after switching from Bitcoin Core or the pre-RDTS flavor — because bitcoind trusts its persisted block verdicts and never re-checks buried blocks against rules that were not active when they were connected. StartOS queues this automatically when a flavor switch or package update changes the enforcement regime; run it manually only as a recovery measure. If the service is running it restarts immediately to begin the replay; if it is stopped, the replay runs at the next start. Either way the node disconnects to the anchor height and replays the chain with full validation, rejecting any block that violates RDTS.',
      { height: String(RDTS_FIRST_APPLICABLE_HEIGHT) },
    ),
    warning: i18n(
      'Replaying the chain from the anchor height can take from minutes to many hours depending on how far the chain has advanced, and it may reorganize this node onto a different chain than the one it currently follows — that is the point. Pruned nodes that no longer store the anchor height cannot replay locally and are directed to Reindex Blockchain instead. A node running from a not-yet-validated UTXO snapshot also cannot replay in place yet, but needs no action — the replay runs automatically once the snapshot finishes background validation; Reindex Blockchain is offered only to force it sooner.',
    ),
    allowedStatuses: 'any',
    group: i18n('Chain Recovery'),
    visibility: 'enabled',
  }),

  // execution function
  async ({ effects }) => {
    await storeJson.merge(effects, { revalidateFromRdts: true })

    const status = await sdk
      .getStatus(effects, { packageId: 'bitcoind' })
      .once()

    if (status?.desired.main === 'running') {
      await sdk.restart(effects)
      return {
        version: '1',
        title: i18n('Success'),
        message: i18n(
          'Restarting bitcoind to re-validate the RDTS-applicable block range if the chain has advanced past it. Any replay runs with its progress in the service logs and a notification on completion; if there is nothing to replay it clears without further notice.',
        ),
        result: null,
      }
    }

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n(
        'The RDTS-applicable block range will be re-validated the next time bitcoind starts.',
      ),
      result: null,
    }
  },
)
