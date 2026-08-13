import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v29_4_1 } from './v29.4_1'

export const versionGraph = VersionGraph.of({
  current,
  other: [v29_4_1],
})
