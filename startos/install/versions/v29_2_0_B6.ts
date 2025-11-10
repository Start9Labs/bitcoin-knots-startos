import { VersionInfo } from '@start9labs/start-sdk'
import { coreCurrent as v29_2_0_2 } from 'bitcoind-startos/startos/install/versions'

export const v29_2_0_B6 = VersionInfo.of({
  version: '#knots:29.2:6-beta.6',
  releaseNotes: 'Update to Bitcoin Knots v29.2.knots20251110',
  migrations: {
    up: async () => {},
    down: async () => {},
  }
}).satisfies(v29_2_0_2.options.version)
