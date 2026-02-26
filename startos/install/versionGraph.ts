import { VersionGraph } from '@start9labs/start-sdk'
import { knotsCurrent, other } from './versions'

export const versionGraph = VersionGraph.of({
  current: knotsCurrent,
  other,
})
