import { sdk } from '../sdk'
import { otherConfig } from './config/other'
import { mempoolConfig } from './config/mempool'
import { peerConfig } from './config/peers'
import { rpcConfig } from './config/rpc'
import { deleteCoinstatsIndex } from './deleteCoinstatsIndex'
import { deletePeers } from './deletePeers'
import { deleteRpcAuth } from './deleteRpcAuth'
import { deleteTxIndex } from './deleteTxIndex'
import { generateRpcUser } from './generateRpcUser'
import { generateRpcUserDependent } from './generateRpcUserDependent'
import { reindexBlockchain } from './reindexBlockchain'
import { reindexChainstate } from './reindexChainstate'
import { runtimeInfo } from './runtimeInfo'
import { assumeutxo } from './assumeutxo'
import { prioritiseTransaction } from './prioritiseTransaction'
import { signMessage } from './sign'
import { getaddress } from './getaddress'
import { getbalance } from './getbalance'
import { sendAllCoin } from './sendallcoin'
import { sendCoin } from './sendcoin'
import { backupwallet } from './backupwallet'

export const actions = sdk.Actions.of()
  .addAction(assumeutxo)
  .addAction(deleteCoinstatsIndex)
  .addAction(deletePeers)
  .addAction(deleteRpcAuth)
  .addAction(deleteTxIndex)
  .addAction(generateRpcUser)
  .addAction(generateRpcUserDependent)
  .addAction(getaddress)
  .addAction(getbalance)
  .addAction(mempoolConfig)
  .addAction(otherConfig)
  .addAction(peerConfig)
  .addAction(prioritiseTransaction)
  .addAction(reindexBlockchain)
  .addAction(reindexChainstate)
  .addAction(rpcConfig)
  .addAction(runtimeInfo)
  .addAction(sendAllCoin)
  .addAction(sendCoin)
  .addAction(signMessage)
  .addAction(backupwallet)
