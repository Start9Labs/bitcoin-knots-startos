import { actions } from '../actions'
import { restoreInit } from '../backups'
import { setDependencies } from '../dependencies'
import { versionGraph } from '../versions'
import { setInterfaces } from '../interfaces'
import { sdk } from '../sdk'
import { seedFiles } from './seedFiles'
import { taskRdtsOptIn } from './rdtsOptIn'
import { watchHosts } from './watchHosts'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  seedFiles,
  setInterfaces,
  setDependencies,
  actions,
  watchHosts,
  taskRdtsOptIn,
)

export const uninit = sdk.setupUninit(versionGraph)
