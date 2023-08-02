import { live, apiLive, run, exit,getBrowserList ,getVersion} from '../open-api'
import { WebSocketServer } from 'ws'
import { RequestSource } from '../typeApi'

export const btos = (b:Buffer) :string => { return new TextDecoder('utf-8').decode(new Uint8Array(b))}

export const WSControlServer = function( port: number = 8888 ) {
  const wss = new WebSocketServer({ port })
  console.log('ws run prot:',port)
  wss.on('connection', function connection( ws ) {
    ws.on('message', function message( msg: any ) {
      console.log('ws command:',btos(msg))
      const command  = JSON.parse(btos(msg))
      command.config.requestSource = RequestSource.ws
      switch(command.api){
        case 'run':
          run(command.config,( result: any ) => {
            ws.send(JSON.stringify(result))
          })
          break
        case 'version':
          ws.send(JSON.stringify(getVersion()))
          break
        case 'browsers':
          getBrowserList((result:any) => {
            ws.send(JSON.stringify(result))
          })
          break
        case 'live':
          live(command.config,( result: any ) => {
            ws.send(JSON.stringify(result))
          })
          break
        case 'apiLive':
          apiLive(command.url, command.config, ( result: any ) =>{
            ws.send(JSON.stringify(result))
          },() => ws.send('__finished'))
          break
        case 'exit':
          exit(()=>{
          })
          break
        case 'ping':
          ws.send('pong')
          break
      }
    })
  })
}
