import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_29_3_24 } from './v29.3_24'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_29_3_24],
})
