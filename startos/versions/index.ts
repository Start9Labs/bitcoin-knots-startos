import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_29_4_7 } from './v29.4_7'
import { v29_4_1 } from './v29.4_1'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_29_4_7, v29_4_1],
})
