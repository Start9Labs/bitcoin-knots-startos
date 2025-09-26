import { VersionInfo } from '@start9labs/start-sdk'
import { coreCurrent as v29_1_0_2 } from 'bitcoind-startos/startos/install/versions'

export const v29_1_0_B4 = VersionInfo.of({
  version: '#knots:29.1:4-beta.4',
  releaseNotes: 'Revamped for StartOS 0.4.0',
  migrations: {
    up: async () => {},
    down: async () => {},
  }
}).satisfies(v29_1_0_2.options.version)