import { serviceImpl } from './serverImpl'
import bodyParser from 'body-parser'
const express = require('express')
const httpserver = express()

export interface Ret {
  success?: boolean
  data?: any
  msg?: string
  code?: number
  total?: number
}

httpserver.use(bodyParser.urlencoded({ extended: false }))
httpserver.use(bodyParser.json({limit:"50mb"}))

export const httpControlServer = function( port: number ) {
  var server = httpserver.listen(port)
  console.log(`http listening on *:${port}`)
  server.on('error', function( err:any ) {
    if (err.code === 'EADDRINUSE') { // 端口已经被使用
      /**
       * 当端口被占用时，不要采用dialog弹窗，
       * 采用node-notifier 试试(todo: 需要测试,以及先修复服务二次执行问题)
       */
      console.log('ERROR: The port is used!', port)
      process.exit();
    }
  })

  httpserver.get('/ping', serviceImpl.ping)
  httpserver.post('/run', serviceImpl.runScript)
  // 导出以支持扩展
  return httpserver
}

export default httpControlServer
