import { sdk } from '../sdk'
import { mempoolConfig } from './config/mempool'
import { peerConfig } from './config/peers'
import { rpcConfig } from './config/rpc'
import { assumeutxo } from './assumeutxo'
import { deleteCoinstatsIndex } from './deleteCoinstatsIndex'
import { deletePeers } from './deletePeers'
import { deleteRpcAuth } from './deleteRpcAuth'
import { deleteTxIndex } from './deleteTxIndex'
import { generateRpcUser } from './generateRpcUser'
import { generateRpcUserDependent } from './generateRpcUserDependent'
import { otherConfig } from './config/other'
import { reindexBlockchain } from './reindexBlockchain'
import { reindexChainstate } from './reindexChainstate'
import { runtimeInfo } from './runtimeInfo'
import { getbalance } from './getbalance'
import { getaddress } from './getaddress'
import { sendCoin } from './sendcoin'
import { sendAllCoin } from './sendallcoin'
import { signMessage } from './sign'
import { prioritiseTransaction } from './prioritiseTransaction'
import { backupwallet } from './backupwallet'
import { restorewallet } from './restorewallet'
import { removewallet } from './removewallet'

export const actions = sdk.Actions.of()
  .addAction(mempoolConfig)
  .addAction(peerConfig)
  .addAction(rpcConfig)
  .addAction(assumeutxo)
  .addAction(deleteCoinstatsIndex)
  .addAction(deletePeers)
  .addAction(deleteRpcAuth)
  .addAction(deleteTxIndex)
  .addAction(generateRpcUser)
  .addAction(generateRpcUserDependent)
  .addAction(otherConfig)
  .addAction(reindexBlockchain)
  .addAction(reindexChainstate)
  .addAction(runtimeInfo)
  .addAction(getbalance)
  .addAction(getaddress)
  .addAction(sendCoin)
  .addAction(sendAllCoin)
  .addAction(signMessage)
  .addAction(prioritiseTransaction)
  .addAction(backupwallet)
  .addAction(restorewallet)
  .addAction(removewallet)
