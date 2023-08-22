import { serviceImpl } from './serverImpl'
import httpControlServer from '@cherry-jd/cherry-server'
import path from 'path'
const { app } = require('electron')
const vueServerRoot = path.resolve(app.getAppPath() , 'lib') 

console.log('vueServer',vueServerRoot, httpControlServer)

export interface Ret {
  success?: boolean
  data?: any
  msg?: string
  code?: number
  total?: number
}


export const startHttpControlServer = function( port: number ) {
  const httpserver = httpControlServer(port)
  
  httpserver.post('/live', serviceImpl.liveScript)

  httpserver.get('/exit', serviceImpl.exit)
  httpserver.get('/version', serviceImpl.version)

  httpserver.get('/releaseLog', serviceImpl.releaseLog)
  httpserver.get('/browsers', serviceImpl.getBrowsers)
  httpserver.get('/errorImage', serviceImpl.errorImage)
}

export default httpControlServer
